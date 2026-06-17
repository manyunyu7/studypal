import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const quizRouter = createTRPCRouter({
  submitAttempt: protectedProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        answers: z.array(
          z.object({
            questionId: z.number().int(),
            selectedOptionId: z.number().int().nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Fetch all questions with options for this topic
      const questions = await ctx.db.question.findMany({
        where: { topicId: input.topicId },
        include: { options: true },
      });

      // Build a map: questionId -> correct optionId, explanation
      const questionMap = new Map(
        questions.map((q) => [
          q.id,
          {
            correctOptionId: q.options.find((o) => o.isCorrect)?.id,
            explanation: q.explanation,
          },
        ]),
      );

      let score = 0;
      const total = input.answers.length;

      const answerResults = input.answers.map((ans) => {
        const qData = questionMap.get(ans.questionId);
        const isCorrect = qData?.correctOptionId === ans.selectedOptionId;
        if (isCorrect) score++;
        return {
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          isCorrect,
          correctOptionId: qData?.correctOptionId ?? null,
          explanation: qData?.explanation ?? null,
        };
      });

      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      // Persist attempt
      const attempt = await ctx.db.quizAttempt.create({
        data: {
          userId,
          topicId: input.topicId,
          score,
          total,
          answers: {
            create: answerResults.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: a.isCorrect,
            })),
          },
        },
      });

      // Update per-question progress so "ulangi yang salah" & weak-area stats work.
      await Promise.all(
        answerResults.map((a) =>
          ctx.db.questionProgress.upsert({
            where: { userId_questionId: { userId, questionId: a.questionId } },
            create: {
              userId,
              questionId: a.questionId,
              timesCorrect: a.isCorrect ? 1 : 0,
              timesWrong: a.isCorrect ? 0 : 1,
              lastCorrect: a.isCorrect,
            },
            update: {
              timesCorrect: { increment: a.isCorrect ? 1 : 0 },
              timesWrong: { increment: a.isCorrect ? 0 : 1 },
              lastCorrect: a.isCorrect,
              lastSeen: new Date(),
            },
          }),
        ),
      );

      return {
        attemptId: attempt.id,
        score,
        total,
        percentage,
        answers: answerResults,
      };
    }),

  getMyAttempts: protectedProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.quizAttempt.findMany({
        where: { userId: ctx.session.user.id, topicId: input.topicId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    }),

  /** Riwayat lengkap semua sesi quiz user (lintas topik & try out) + ringkasan. */
  getMyHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const attempts = await ctx.db.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Resolve nama topik & subject (QuizAttempt nggak punya relasi langsung).
    const topicIds = [...new Set(attempts.map((a) => a.topicId).filter((v): v is number => v != null))];
    const subjectIds = [...new Set(attempts.map((a) => a.subjectId).filter((v): v is number => v != null))];

    const [topics, subjects] = await Promise.all([
      topicIds.length
        ? ctx.db.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      subjectIds.length
        ? ctx.db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
    ]);
    const topicName = new Map(topics.map((t) => [t.id, t.name]));
    const subjectName = new Map(subjects.map((s) => [s.id, s.name]));

    const items = attempts.map((a) => {
      const isTryOut = a.topicId == null && a.subjectId != null;
      const label = isTryOut
        ? `Try Out · ${subjectName.get(a.subjectId!) ?? "Tryout"}`
        : (topicName.get(a.topicId ?? -1) ?? "Quiz");
      return {
        id: a.id,
        label,
        isTryOut,
        score: a.score,
        total: a.total,
        percentage: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
        createdAt: a.createdAt,
      };
    });

    // Ringkasan (dari semua attempt, bukan cuma 100 — tapi take 100 cukup buat sekarang).
    const totalAttempts = items.length;
    const totalQuestions = items.reduce((s, i) => s + i.total, 0);
    const totalCorrect = items.reduce((s, i) => s + i.score, 0);
    const avgPercentage =
      totalAttempts > 0 ? Math.round(items.reduce((s, i) => s + i.percentage, 0) / totalAttempts) : 0;
    const bestPercentage = items.reduce((m, i) => Math.max(m, i.percentage), 0);

    return {
      items,
      summary: { totalAttempts, totalQuestions, totalCorrect, avgPercentage, bestPercentage },
    };
  }),

  getLeaderboard: protectedProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      // Get best score per user for this topic
      const attempts = await ctx.db.quizAttempt.findMany({
        where: { topicId: input.topicId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { score: "desc" },
      });

      // Aggregate best score per user
      const userBestMap = new Map<
        string,
        { userId: string; name: string | null; image: string | null; bestScore: number; total: number }
      >();

      for (const attempt of attempts) {
        const existing = userBestMap.get(attempt.userId);
        if (!existing || attempt.score > existing.bestScore) {
          userBestMap.set(attempt.userId, {
            userId: attempt.userId,
            name: attempt.user.name,
            image: attempt.user.image,
            bestScore: attempt.score,
            total: attempt.total,
          });
        }
      }

      const leaderboard = Array.from(userBestMap.values())
        .map((entry) => ({
          ...entry,
          percentage: entry.total > 0 ? Math.round((entry.bestScore / entry.total) * 100) : 0,
        }))
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 10);

      return leaderboard;
    }),

  /** Grade a cross-topic "Try Out" and return a per-topic breakdown. */
  submitTryOut: protectedProcedure
    .input(
      z.object({
        subjectId: z.number().int(),
        answers: z.array(
          z.object({
            questionId: z.number().int(),
            selectedOptionId: z.number().int().nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const qIds = input.answers.map((a) => a.questionId);
      const questions = await ctx.db.question.findMany({
        where: { id: { in: qIds } },
        include: { options: true, topic: { select: { id: true, name: true } } },
      });
      const qMap = new Map(questions.map((q) => [q.id, q]));

      let score = 0;
      const total = input.answers.length;
      const answerResults = input.answers.map((ans) => {
        const q = qMap.get(ans.questionId);
        const correctOptionId = q?.options.find((o) => o.isCorrect)?.id ?? null;
        const isCorrect = correctOptionId === ans.selectedOptionId;
        if (isCorrect) score++;
        return {
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          isCorrect,
          correctOptionId,
          explanation: q?.explanation ?? null,
          topicId: q?.topic.id ?? null,
          topicName: q?.topic.name ?? "",
        };
      });
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      const attempt = await ctx.db.quizAttempt.create({
        data: {
          userId,
          subjectId: input.subjectId,
          topicId: null,
          score,
          total,
          answers: {
            create: answerResults.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: a.isCorrect,
            })),
          },
        },
      });

      await Promise.all(
        answerResults.map((a) =>
          ctx.db.questionProgress.upsert({
            where: { userId_questionId: { userId, questionId: a.questionId } },
            create: {
              userId,
              questionId: a.questionId,
              timesCorrect: a.isCorrect ? 1 : 0,
              timesWrong: a.isCorrect ? 0 : 1,
              lastCorrect: a.isCorrect,
            },
            update: {
              timesCorrect: { increment: a.isCorrect ? 1 : 0 },
              timesWrong: { increment: a.isCorrect ? 0 : 1 },
              lastCorrect: a.isCorrect,
              lastSeen: new Date(),
            },
          }),
        ),
      );

      // Per-topic breakdown (sorted weakest first) — the diagnostic payoff.
      const topicAgg = new Map<number, { name: string; correct: number; total: number }>();
      for (const a of answerResults) {
        if (a.topicId == null) continue;
        const cur = topicAgg.get(a.topicId) ?? { name: a.topicName, correct: 0, total: 0 };
        cur.total++;
        if (a.isCorrect) cur.correct++;
        topicAgg.set(a.topicId, cur);
      }
      const byTopic = Array.from(topicAgg.entries())
        .map(([topicId, v]) => ({
          topicId,
          topicName: v.name,
          correct: v.correct,
          total: v.total,
          percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        }))
        .sort((a, b) => a.percentage - b.percentage);

      return { attemptId: attempt.id, score, total, percentage, answers: answerResults, byTopic };
    }),

  getTryOutLeaderboard: protectedProcedure
    .input(z.object({ subjectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const attempts = await ctx.db.quizAttempt.findMany({
        where: { subjectId: input.subjectId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { score: "desc" },
      });
      const best = new Map<
        string,
        { userId: string; name: string | null; image: string | null; bestScore: number; total: number }
      >();
      for (const a of attempts) {
        const cur = best.get(a.userId);
        const pct = a.total > 0 ? a.score / a.total : 0;
        const curPct = cur && cur.total > 0 ? cur.bestScore / cur.total : 0;
        if (!cur || pct > curPct) {
          best.set(a.userId, {
            userId: a.userId,
            name: a.user.name,
            image: a.user.image,
            bestScore: a.score,
            total: a.total,
          });
        }
      }
      return Array.from(best.values())
        .map((e) => ({ ...e, percentage: e.total > 0 ? Math.round((e.bestScore / e.total) * 100) : 0 }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);
    }),
});

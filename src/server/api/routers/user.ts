import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";

const themePreferenceSchema = z.object({
  mode: z.enum(["light", "dark", "system"]).optional(),
  preset: z.string().max(40).optional(),
  accent: z.string().max(40).nullable().optional(),
  radius: z.number().min(0).max(2).optional(),
  font: z.enum(["sans", "serif", "mono", "rounded"]).optional(),
});
type ThemePreferenceInput = z.infer<typeof themePreferenceSchema>;

export const userRouter = createTRPCRouter({
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();

    const [attempts, masteredFlashcards, totalFlashcards, dueToday, qProgress, topics, reviewDates] =
      await Promise.all([
        ctx.db.quizAttempt.findMany({
          where: { userId },
          select: { score: true, total: true, createdAt: true },
        }),
        ctx.db.flashcardProgress.count({ where: { userId, mastered: true } }),
        ctx.db.flashcard.count(),
        ctx.db.flashcardProgress.count({ where: { userId, dueDate: { lte: now } } }),
        ctx.db.questionProgress.findMany({
          where: { userId },
          select: { lastCorrect: true, question: { select: { topicId: true } } },
        }),
        ctx.db.topic.findMany({
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
            _count: { select: { questions: true } },
          },
          orderBy: { order: "asc" },
        }),
        ctx.db.flashcardProgress.findMany({
          where: { userId, lastReviewed: { not: null } },
          select: { lastReviewed: true },
        }),
      ]);

    const totalQuizAttempts = attempts.length;
    const avgScore =
      totalQuizAttempts > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) /
              totalQuizAttempts,
          )
        : 0;

    // ── Per-topic mastery ──
    const topicAgg = new Map<number, { mastered: number; weak: number; answered: number }>();
    for (const p of qProgress) {
      const tid = p.question.topicId;
      const cur = topicAgg.get(tid) ?? { mastered: 0, weak: 0, answered: 0 };
      cur.answered++;
      if (p.lastCorrect) cur.mastered++;
      else cur.weak++;
      topicAgg.set(tid, cur);
    }

    const perTopic = topics.map((t) => {
      const agg = topicAgg.get(t.id) ?? { mastered: 0, weak: 0, answered: 0 };
      const totalQuestions = t._count.questions;
      return {
        topicId: t.id,
        topicName: t.name,
        subjectName: t.subject.name,
        totalQuestions,
        masteredQuestions: agg.mastered,
        weakQuestions: agg.weak,
        answered: agg.answered,
        accuracy: agg.answered > 0 ? Math.round((agg.mastered / agg.answered) * 100) : 0,
        masteryPct: totalQuestions > 0 ? Math.round((agg.mastered / totalQuestions) * 100) : 0,
      };
    });

    const weakTopics = perTopic
      .filter((t) => t.answered >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // ── Streak: consecutive days (ending today or yesterday) with any activity ──
    const ds = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const activeDays = new Set<string>();
    for (const a of attempts) activeDays.add(ds(a.createdAt));
    for (const r of reviewDates) if (r.lastReviewed) activeDays.add(ds(r.lastReviewed));

    let streak = 0;
    const cursor = new Date(now);
    if (!activeDays.has(ds(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (activeDays.has(ds(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      totalQuizAttempts,
      avgScore,
      masteredFlashcards,
      totalFlashcards,
      dueToday,
      streak,
      perTopic,
      weakTopics,
    };
  }),

  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["USER", "ADMIN"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  getThemePreference: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { themePreference: true },
    });
    return (user?.themePreference ?? null) as ThemePreferenceInput | null;
  }),

  setThemePreference: protectedProcedure
    .input(themePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { themePreference: input },
      });
      return input;
    }),
});

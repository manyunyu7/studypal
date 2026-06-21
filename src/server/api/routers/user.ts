import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
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
      // Guard: never let the last admin demote themselves into a lockout.
      if (input.role === "USER") {
        const target = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: { role: true },
        });
        if (target?.role === "ADMIN") {
          const adminCount = await ctx.db.user.count({ where: { role: "ADMIN" } });
          if (adminCount <= 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Tidak bisa menurunkan admin terakhir. Buat admin lain dulu.",
            });
          }
        }
      }
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  /** ── Admin: create a new account (with hashed password). ── */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nama wajib diisi").max(100),
        email: z.string().email("Email tidak valid"),
        password: z.string().min(6, "Password minimal 6 karakter").max(100),
        role: z.enum(["USER", "ADMIN"]).default("USER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (exists) {
        throw new TRPCError({ code: "CONFLICT", message: "Email sudah terdaftar" });
      }
      const hashedPassword = await bcrypt.hash(input.password, 12);
      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  /** ── Admin: set a new password for any user. ── */
  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        password: z.string().min(6, "Password minimal 6 karakter").max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });
      return { ok: true };
    }),

  /** ── Admin: hard-delete a user and all of their progress. ── */
  delete: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tidak bisa menghapus akun sendiri.",
        });
      }
      // QuizAttempt / FlashcardProgress / QuestionProgress / QuestionBookmark have no
      // cascade on the user relation, so clear them first; Account/Session/ActivityLog cascade.
      await ctx.db.$transaction([
        ctx.db.quizAttempt.deleteMany({ where: { userId: input.userId } }),
        ctx.db.flashcardProgress.deleteMany({ where: { userId: input.userId } }),
        ctx.db.questionProgress.deleteMany({ where: { userId: input.userId } }),
        ctx.db.questionBookmark.deleteMany({ where: { userId: input.userId } }),
        ctx.db.user.delete({ where: { id: input.userId } }),
      ]);
      return { ok: true };
    }),

  /** ── Admin: full progress detail for one user. ── */
  getDetail: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
      }

      const [attempts, masteredFlashcards, activityCount, lastActivity, topics, subjects] =
        await Promise.all([
          ctx.db.quizAttempt.findMany({
            where: { userId: input.userId },
            select: { score: true, total: true, createdAt: true, topicId: true, subjectId: true },
            orderBy: { createdAt: "desc" },
          }),
          ctx.db.flashcardProgress.count({ where: { userId: input.userId, mastered: true } }),
          ctx.db.activityLog.count({ where: { userId: input.userId } }),
          ctx.db.activityLog.findFirst({
            where: { userId: input.userId },
            orderBy: { id: "desc" },
            select: { createdAt: true, type: true, label: true },
          }),
          ctx.db.topic.findMany({ select: { id: true, name: true, subjectId: true } }),
          ctx.db.subject.findMany({ select: { id: true, name: true } }),
        ]);

      const totalAttempts = attempts.length;
      const avgScore =
        totalAttempts > 0
          ? Math.round(
              attempts.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) /
                totalAttempts,
            )
          : 0;
      const bestScore = attempts.reduce(
        (m, a) => Math.max(m, a.total > 0 ? Math.round((a.score / a.total) * 100) : 0),
        0,
      );

      // Per-subject breakdown (topic-quiz attempts mapped via topic→subject; tryouts direct).
      const topicToSubject = new Map(topics.map((t) => [t.id, t.subjectId]));
      const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
      const subjectAgg = new Map<number, { score: number; total: number; attempts: number }>();
      for (const a of attempts) {
        const subjectId = a.subjectId ?? (a.topicId != null ? topicToSubject.get(a.topicId) : undefined);
        if (subjectId == null) continue;
        const cur = subjectAgg.get(subjectId) ?? { score: 0, total: 0, attempts: 0 };
        cur.score += a.score;
        cur.total += a.total;
        cur.attempts++;
        subjectAgg.set(subjectId, cur);
      }
      const perSubject = Array.from(subjectAgg.entries())
        .map(([subjectId, v]) => ({
          subjectId,
          name: subjectName.get(subjectId) ?? "—",
          attempts: v.attempts,
          avgPct: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0,
        }))
        .sort((a, b) => b.attempts - a.attempts);

      // Recent quiz sessions (resolve label from topic/subject).
      const topicName = new Map(topics.map((t) => [t.id, t.name]));
      const recentAttempts = attempts.slice(0, 10).map((a) => {
        const isTryOut = a.topicId == null && a.subjectId != null;
        return {
          label: isTryOut
            ? `Try Out · ${subjectName.get(a.subjectId!) ?? "Tryout"}`
            : (topicName.get(a.topicId ?? -1) ?? "Quiz"),
          score: a.score,
          total: a.total,
          percentage: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
          createdAt: a.createdAt,
        };
      });

      return {
        user,
        stats: {
          totalAttempts,
          avgScore,
          bestScore,
          masteredFlashcards,
          activityCount,
          lastActivity,
        },
        perSubject,
        recentAttempts,
      };
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

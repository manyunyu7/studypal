import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";
import { Prisma } from "../../../../generated/prisma";

const optionInputSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number().int().optional(),
});

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const questionRouter = createTRPCRouter({
  // Kept for backward-compat / simple listings.
  getByTopic: protectedProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.question.findMany({
        where: { topicId: input.topicId },
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      });
    }),

  /**
   * Metadata for the quiz-bank config screen: total, breakdown by difficulty,
   * available tags, and how many questions the user previously got wrong /
   * bookmarked for this topic.
   */
  getBankMeta: protectedProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [questions, wrongCount, bookmarkCount] = await Promise.all([
        ctx.db.question.findMany({
          where: { topicId: input.topicId },
          select: { difficulty: true, tag: true },
        }),
        ctx.db.questionProgress.count({
          where: { userId, lastCorrect: false, question: { topicId: input.topicId } },
        }),
        ctx.db.questionBookmark.count({
          where: { userId, question: { topicId: input.topicId } },
        }),
      ]);

      const byDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
      const tagMap = new Map<string, number>();
      for (const q of questions) {
        byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
        if (q.tag) tagMap.set(q.tag, (tagMap.get(q.tag) ?? 0) + 1);
      }

      return {
        total: questions.length,
        byDifficulty,
        tags: Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count),
        wrongCount,
        bookmarkCount,
      };
    }),

  /**
   * Build a randomized quiz set from the bank, honoring length, difficulty,
   * tag, and source (all / wrong / bookmarked) filters. Options are shuffled.
   * `isCorrect` is included so practice mode can give instant feedback.
   */
  getQuizSet: protectedProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        length: z.number().int().min(1).max(200),
        difficulty: difficultyEnum.optional(),
        tags: z.array(z.string()).optional(),
        source: z.enum(["all", "wrong", "bookmarked"]).default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const where: Prisma.QuestionWhereInput = { topicId: input.topicId };
      if (input.difficulty) where.difficulty = input.difficulty;
      if (input.tags && input.tags.length > 0) where.tag = { in: input.tags };
      if (input.source === "wrong") {
        where.progress = { some: { userId, lastCorrect: false } };
      } else if (input.source === "bookmarked") {
        where.bookmarks = { some: { userId } };
      }

      const candidates = await ctx.db.question.findMany({
        where,
        include: {
          options: true,
          bookmarks: { where: { userId }, select: { id: true } },
        },
      });

      const picked = shuffle(candidates).slice(0, input.length);

      return picked.map((q) => ({
        id: q.id,
        text: q.text,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tag: q.tag,
        bookmarked: q.bookmarks.length > 0,
        options: shuffle(q.options).map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }));
    }),

  /** Metadata for the subject-level "Try Out" config screen. */
  getTryOutMeta: protectedProcedure
    .input(z.object({ subjectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const [subject, topics] = await Promise.all([
        ctx.db.subject.findUnique({ where: { id: input.subjectId }, select: { name: true } }),
        ctx.db.topic.findMany({ where: { subjectId: input.subjectId }, select: { id: true } }),
      ]);
      const topicIds = topics.map((t) => t.id);
      const questions = await ctx.db.question.findMany({
        where: { topicId: { in: topicIds } },
        select: { difficulty: true },
      });
      const byDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
      for (const q of questions) byDifficulty[q.difficulty]++;
      return {
        subjectName: subject?.name ?? "",
        topicCount: topicIds.length,
        total: questions.length,
        byDifficulty,
      };
    }),

  /** Build a randomized cross-topic quiz set spanning a whole subject. */
  getTryOutSet: protectedProcedure
    .input(
      z.object({
        subjectId: z.number().int(),
        length: z.number().int().min(1).max(200),
        difficulty: difficultyEnum.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const topics = await ctx.db.topic.findMany({
        where: { subjectId: input.subjectId },
        select: { id: true },
      });
      const where: Prisma.QuestionWhereInput = { topicId: { in: topics.map((t) => t.id) } };
      if (input.difficulty) where.difficulty = input.difficulty;

      const candidates = await ctx.db.question.findMany({
        where,
        include: {
          options: true,
          topic: { select: { name: true } },
          bookmarks: { where: { userId }, select: { id: true } },
        },
      });

      return shuffle(candidates)
        .slice(0, input.length)
        .map((q) => ({
          id: q.id,
          text: q.text,
          explanation: q.explanation,
          difficulty: q.difficulty,
          tag: q.tag,
          topicId: q.topicId,
          topicName: q.topic.name,
          bookmarked: q.bookmarks.length > 0,
          options: shuffle(q.options).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        }));
    }),

  toggleBookmark: protectedProcedure
    .input(z.object({ questionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.questionBookmark.findUnique({
        where: { userId_questionId: { userId, questionId: input.questionId } },
      });
      if (existing) {
        await ctx.db.questionBookmark.delete({ where: { id: existing.id } });
        return { bookmarked: false };
      }
      await ctx.db.questionBookmark.create({
        data: { userId, questionId: input.questionId },
      });
      return { bookmarked: true };
    }),

  create: adminProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        text: z.string().min(1),
        explanation: z.string().optional(),
        difficulty: difficultyEnum.optional(),
        tag: z.string().optional(),
        options: z.array(optionInputSchema).min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const question = await tx.question.create({
          data: {
            topicId: input.topicId,
            text: input.text,
            explanation: input.explanation,
            difficulty: input.difficulty ?? "MEDIUM",
            tag: input.tag,
          },
        });
        await tx.questionOption.createMany({
          data: input.options.map((opt, idx) => ({
            questionId: question.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order ?? idx,
          })),
        });
        return tx.question.findUnique({
          where: { id: question.id },
          include: { options: { orderBy: { order: "asc" } } },
        });
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        text: z.string().min(1),
        explanation: z.string().optional(),
        difficulty: difficultyEnum.optional(),
        tag: z.string().optional(),
        options: z.array(optionInputSchema).min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        await tx.question.update({
          where: { id: input.id },
          data: {
            text: input.text,
            explanation: input.explanation,
            ...(input.difficulty ? { difficulty: input.difficulty } : {}),
            ...(input.tag !== undefined ? { tag: input.tag } : {}),
          },
        });
        await tx.questionOption.deleteMany({ where: { questionId: input.id } });
        await tx.questionOption.createMany({
          data: input.options.map((opt, idx) => ({
            questionId: input.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order ?? idx,
          })),
        });
        return tx.question.findUnique({
          where: { id: input.id },
          include: { options: { orderBy: { order: "asc" } } },
        });
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.questionOption.deleteMany({ where: { questionId: input.id } });
      await ctx.db.question.delete({ where: { id: input.id } });
    }),

  bulkImport: adminProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        questions: z.array(
          z.object({
            text: z.string().min(1),
            explanation: z.string().optional(),
            difficulty: difficultyEnum.optional(),
            tag: z.string().optional(),
            options: z.array(optionInputSchema),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.$transaction(async (tx) => {
        for (const q of input.questions) {
          const question = await tx.question.create({
            data: {
              topicId: input.topicId,
              text: q.text,
              explanation: q.explanation,
              difficulty: q.difficulty ?? "MEDIUM",
              tag: q.tag,
            },
          });
          await tx.questionOption.createMany({
            data: q.options.map((opt, idx) => ({
              questionId: question.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: opt.order ?? idx,
            })),
          });
        }
        return input.questions.length;
      });
      return { count };
    }),
});

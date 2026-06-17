import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "~/server/api/trpc";

/**
 * Simplified SM-2 spaced-repetition scheduler (day granularity).
 * grade: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy.
 */
function computeSrs(
  prev: { ease: number; interval: number; repetitions: number },
  grade: 0 | 1 | 2 | 3,
) {
  let { ease, interval, repetitions } = prev;

  if (grade === 0) {
    repetitions = 0;
    interval = 0; // review again today
    ease = Math.max(1.3, ease - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = grade === 1 ? 2 : 3;
    else interval = Math.round(interval * ease);

    if (grade === 1) ease = Math.max(1.3, ease - 0.15);
    else if (grade === 3) {
      ease = ease + 0.15;
      interval = Math.max(interval, Math.round(interval * 1.2));
    }
  }

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ease,
    interval,
    repetitions,
    dueDate,
    lastReviewed: now,
    mastered: interval >= 21,
  };
}

export const flashcardRouter = createTRPCRouter({
  getByTopic: protectedProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date();
      const flashcards = await ctx.db.flashcard.findMany({
        where: { topicId: input.topicId },
        include: { progress: { where: { userId } } },
        orderBy: { order: "asc" },
      });
      return flashcards.map((fc) => {
        const p = fc.progress[0];
        return {
          id: fc.id,
          front: fc.front,
          back: fc.back,
          order: fc.order,
          topicId: fc.topicId,
          createdAt: fc.createdAt,
          updatedAt: fc.updatedAt,
          mastered: p?.mastered ?? false,
          repetitions: p?.repetitions ?? 0,
          interval: p?.interval ?? 0,
          dueDate: p?.dueDate ?? null,
          isNew: !p,
          isDue: !p || (p.dueDate != null && p.dueDate <= now),
        };
      });
    }),

  /** Record an SRS review with a self-graded recall quality. */
  reviewCard: protectedProcedure
    .input(
      z.object({
        flashcardId: z.number().int(),
        grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.flashcardProgress.findUnique({
        where: { userId_flashcardId: { userId, flashcardId: input.flashcardId } },
      });
      const next = computeSrs(
        {
          ease: existing?.ease ?? 2.5,
          interval: existing?.interval ?? 0,
          repetitions: existing?.repetitions ?? 0,
        },
        input.grade,
      );
      await ctx.db.flashcardProgress.upsert({
        where: { userId_flashcardId: { userId, flashcardId: input.flashcardId } },
        create: { userId, flashcardId: input.flashcardId, ...next },
        update: next,
      });
      return { interval: next.interval, mastered: next.mastered };
    }),

  // Kept for backward compatibility (simple mastered toggle).
  setProgress: protectedProcedure
    .input(z.object({ flashcardId: z.number().int(), mastered: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db.flashcardProgress.upsert({
        where: { userId_flashcardId: { userId, flashcardId: input.flashcardId } },
        create: { userId, flashcardId: input.flashcardId, mastered: input.mastered },
        update: { mastered: input.mastered },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        front: z.string().min(1),
        back: z.string().min(1),
        order: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.flashcard.create({
        data: {
          topicId: input.topicId,
          front: input.front,
          back: input.back,
          order: input.order ?? 0,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        front: z.string().min(1),
        back: z.string().min(1),
        order: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.flashcard.update({
        where: { id: input.id },
        data: {
          front: input.front,
          back: input.back,
          ...(input.order !== undefined ? { order: input.order } : {}),
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.flashcardProgress.deleteMany({ where: { flashcardId: input.id } });
      await ctx.db.flashcard.delete({ where: { id: input.id } });
    }),
});

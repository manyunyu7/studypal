import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";

export const topicRouter = createTRPCRouter({
  getBySubject: publicProcedure
    .input(z.object({ subjectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.topic.findMany({
        where: { subjectId: input.subjectId },
        orderBy: { order: "asc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.topic.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { questions: true, flashcards: true },
          },
          subject: { include: { semester: true } },
        },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        order: z.number().int().optional(),
        subjectId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.topic.create({
        data: {
          name: input.name,
          description: input.description,
          order: input.order ?? 0,
          subjectId: input.subjectId,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1),
        description: z.string().optional(),
        order: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.topic.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          ...(input.order !== undefined ? { order: input.order } : {}),
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.topic.delete({ where: { id: input.id } });
    }),
});

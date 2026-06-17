import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";

export const subjectRouter = createTRPCRouter({
  getBySemester: publicProcedure
    .input(z.object({ semesterId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.subject.findMany({
        where: { semesterId: input.semesterId },
        include: { _count: { select: { topics: true } } },
        orderBy: { name: "asc" },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        semesterId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.create({
        data: {
          name: input.name,
          description: input.description,
          icon: input.icon,
          semesterId: input.semesterId,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.update({
        where: { id: input.id },
        data: { name: input.name, description: input.description, icon: input.icon },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.subject.delete({ where: { id: input.id } });
    }),
});

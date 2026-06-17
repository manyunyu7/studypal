import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";

export const semesterRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.semester.findMany({
      orderBy: { createdAt: "asc" },
    });
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), year: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.semester.create({
        data: { name: input.name, year: input.year },
      });
    }),

  update: adminProcedure
    .input(z.object({ id: z.number().int(), name: z.string().min(1), year: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.semester.update({
        where: { id: input.id },
        data: { name: input.name, year: input.year },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.semester.delete({ where: { id: input.id } });
    }),
});

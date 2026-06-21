import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  resolveMessages,
  type Tone,
  type PersonalizationOverrides,
} from "~/lib/personalization";

function firstNameOf(name?: string | null) {
  return name?.split(" ")[0]?.trim() || "Kamu";
}

export const personalizationRouter = createTRPCRouter({
  /** Bundel teks resolved untuk user yang sedang login (dipakai di UI). */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { name: true, tone: true, personalization: true },
    });
    const tone = (user?.tone ?? "NEUTRAL") as Tone;
    const overrides = (user?.personalization ?? null) as PersonalizationOverrides | null;
    return resolveMessages(tone, overrides, firstNameOf(user?.name));
  }),

  /** Raw tone + override untuk satu user — buat form admin. */
  getForUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, tone: true, personalization: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
      return {
        tone: user.tone as Tone,
        authorName: user.personalization?.authorName ?? "",
        letterTitle: user.personalization?.letterTitle ?? "",
        letterBody: user.personalization?.letterBody ?? "",
        greeting: user.personalization?.greeting ?? "",
      };
    }),

  /** Update tone + override per-user. String kosong → null (pakai template). */
  update: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tone: z.enum(["SWEET", "NEUTRAL"]),
        authorName: z.string().max(60).optional(),
        letterTitle: z.string().max(200).optional(),
        letterBody: z.string().max(5000).optional(),
        greeting: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, tone } = input;
      const norm = (s?: string) => {
        const v = s?.trim();
        return v ? v : null;
      };
      const data = {
        authorName: norm(input.authorName),
        letterTitle: norm(input.letterTitle),
        letterBody: norm(input.letterBody),
        greeting: norm(input.greeting),
      };

      await ctx.db.user.update({ where: { id: userId }, data: { tone } });
      await ctx.db.personalization.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return { ok: true };
    }),
});

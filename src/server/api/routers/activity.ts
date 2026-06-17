import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { ACTIVITY_TYPES, type ActivityType } from "~/lib/activity";
import type { ActivityType as PrismaActivityType } from "../../../../generated/prisma";

const typeEnum = z.enum(ACTIVITY_TYPES);

/** Activity logs older than this are pruned opportunistically (see `log`). */
const RETENTION_DAYS = 90;
/** Chance per logged event to trigger a background prune of old rows. */
const PRUNE_PROBABILITY = 0.02;

/** Days back → list of `YYYY-M-D` keys + a counts-per-day series for charts. */
function emptyDaySeries(days: number, now: Date) {
  const series: { key: string; date: Date }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    series.push({ key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, date: d });
  }
  return series;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export const activityRouter = createTRPCRouter({
  /** Record one activity event for the current user (called by the client tracker). */
  log: protectedProcedure
    .input(
      z.object({
        type: typeEnum,
        label: z.string().max(120).nullish(),
        path: z.string().max(300).nullish(),
        meta: z.record(z.string(), z.any()).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          type: input.type as PrismaActivityType,
          label: input.label ?? null,
          path: input.path ?? null,
          meta: input.meta ?? undefined,
        },
      });

      // Opportunistic retention cleanup: no cron infra, so occasionally prune
      // rows older than RETENTION_DAYS in the background (never blocks or fails the log).
      if (Math.random() < PRUNE_PROBABILITY) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
        void ctx.db.activityLog
          .deleteMany({ where: { createdAt: { lt: cutoff } } })
          .catch(() => undefined);
      }

      return { ok: true };
    }),

  /** Current user's own activity feed (paginated, newest first). */
  getMine: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(30),
          cursor: z.number().int().nullish(),
        })
        .default({ limit: 30 }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.activityLog.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { id: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      let nextCursor: number | undefined;
      if (items.length > input.limit) nextCursor = items.pop()!.id;
      return { items, nextCursor };
    }),

  /** Summary of the current user's own activity for the dashboard. */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [total, recent, byType] = await Promise.all([
      ctx.db.activityLog.count({ where: { userId: ctx.session.user.id } }),
      ctx.db.activityLog.findMany({
        where: { userId: ctx.session.user.id, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      ctx.db.activityLog.groupBy({
        by: ["type"],
        where: { userId: ctx.session.user.id },
        _count: { _all: true },
      }),
    ]);

    const series = emptyDaySeries(14, now);
    const counts = new Map(series.map((s) => [s.key, 0]));
    const activeDays = new Set<string>();
    for (const r of recent) {
      const k = dayKey(r.createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
      activeDays.add(k);
    }

    return {
      total,
      perDay: series.map((s) => ({
        date: s.date,
        count: counts.get(s.key) ?? 0,
      })),
      byType: byType
        .map((b) => ({ type: b.type as ActivityType, count: b._count._all }))
        .sort((a, b) => b.count - a.count),
      activeDaysLast14: activeDays.size,
    };
  }),

  /** ── Admin: feed across all users with optional filters. ── */
  getAll: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(40),
          cursor: z.number().int().nullish(),
          userId: z.string().nullish(),
          type: typeEnum.nullish(),
        })
        .default({ limit: 40 }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.type ? { type: input.type as PrismaActivityType } : {}),
      };
      const items = await ctx.db.activityLog.findMany({
        where,
        orderBy: { id: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });
      let nextCursor: number | undefined;
      if (items.length > input.limit) nextCursor = items.pop()!.id;
      return { items, nextCursor };
    }),

  /** ── Admin: global activity overview. ── */
  getGlobalStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [total, recent, byType, activeTodayRows, topRows] = await Promise.all([
      ctx.db.activityLog.count(),
      ctx.db.activityLog.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      ctx.db.activityLog.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      ctx.db.activityLog.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      ctx.db.activityLog.groupBy({
        by: ["userId"],
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),
    ]);

    const series = emptyDaySeries(14, now);
    const counts = new Map(series.map((s) => [s.key, 0]));
    for (const r of recent) {
      const k = dayKey(r.createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const topUserIds = topRows.map((r) => r.userId);
    const users = topUserIds.length
      ? await ctx.db.user.findMany({
          where: { id: { in: topUserIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      total,
      activeToday: activeTodayRows.length,
      perDay: series.map((s) => ({ date: s.date, count: counts.get(s.key) ?? 0 })),
      byType: byType
        .map((b) => ({ type: b.type as ActivityType, count: b._count._all }))
        .sort((a, b) => b.count - a.count),
      topUsers: topRows.map((r) => ({
        user: userMap.get(r.userId) ?? { id: r.userId, name: null, email: null, image: null },
        count: r._count._all,
      })),
    };
  }),
});

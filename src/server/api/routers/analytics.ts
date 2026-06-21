import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

/** `YYYY-M-D` day bucket key (local time) — matches activity router convention. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Build an ordered list of the last `days` day-buckets ending today. */
function emptyDaySeries(days: number, now: Date) {
  const series: { key: string; date: Date }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    series.push({ key: dayKey(d), date: d });
  }
  return series;
}

export const analyticsRouter = createTRPCRouter({
  /**
   * Everything the admin dashboard needs, in one round-trip:
   * overview counters, a 30-day quiz trend, hardest questions,
   * per-subject performance, and the most active quiz-takers.
   */
  getDashboard: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const since7 = new Date(now);
    since7.setDate(since7.getDate() - 6);
    since7.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      adminCount,
      newUsers7d,
      activeTodayRows,
      active7dRows,
      attempts,
      totalAnswers,
      correctAnswers,
      topics,
      subjects,
      users,
      questionAgg,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "ADMIN" } }),
      ctx.db.user.count({ where: { createdAt: { gte: since7 } } }),
      ctx.db.activityLog.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      ctx.db.activityLog.findMany({
        where: { createdAt: { gte: since7 } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      ctx.db.quizAttempt.findMany({
        select: {
          score: true,
          total: true,
          createdAt: true,
          topicId: true,
          subjectId: true,
          userId: true,
        },
      }),
      ctx.db.quizAnswer.count(),
      ctx.db.quizAnswer.count({ where: { isCorrect: true } }),
      ctx.db.topic.findMany({
        select: { id: true, subjectId: true },
      }),
      ctx.db.subject.findMany({ select: { id: true, name: true, icon: true } }),
      ctx.db.user.findMany({ select: { id: true, name: true, email: true, image: true } }),
      ctx.db.questionProgress.groupBy({
        by: ["questionId"],
        _sum: { timesCorrect: true, timesWrong: true },
      }),
    ]);

    // ── Overview ──
    const totalAttempts = attempts.length;
    const attemptsToday = attempts.filter((a) => a.createdAt >= todayStart).length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            (attempts.reduce(
              (s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0),
              0,
            ) /
              totalAttempts) *
              10,
          ) / 10
        : 0;
    const overallAccuracy =
      totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 1000) / 10 : 0;

    // ── 30-day quiz trend (count + avg percentage per day) ──
    const series = emptyDaySeries(30, now);
    const dayBuckets = new Map(series.map((s) => [s.key, { count: 0, pctSum: 0 }]));
    for (const a of attempts) {
      const b = dayBuckets.get(dayKey(a.createdAt));
      if (!b) continue;
      b.count++;
      b.pctSum += a.total > 0 ? (a.score / a.total) * 100 : 0;
    }
    const trend = series.map((s) => {
      const b = dayBuckets.get(s.key)!;
      return {
        date: s.date,
        count: b.count,
        avgPct: b.count > 0 ? Math.round(b.pctSum / b.count) : 0,
      };
    });

    // ── Per-subject performance ──
    const topicToSubject = new Map(topics.map((t) => [t.id, t.subjectId]));
    const subjectName = new Map(subjects.map((s) => [s.id, s]));
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
    const subjectPerformance = Array.from(subjectAgg.entries())
      .map(([subjectId, v]) => ({
        subjectId,
        name: subjectName.get(subjectId)?.name ?? "—",
        icon: subjectName.get(subjectId)?.icon ?? null,
        attempts: v.attempts,
        avgPct: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);

    // ── Top quiz-takers (by # attempts, with their avg %) ──
    const userAgg = new Map<string, { score: number; total: number; attempts: number }>();
    for (const a of attempts) {
      const cur = userAgg.get(a.userId) ?? { score: 0, total: 0, attempts: 0 };
      cur.score += a.score;
      cur.total += a.total;
      cur.attempts++;
      userAgg.set(a.userId, cur);
    }
    const userMap = new Map(users.map((u) => [u.id, u]));
    const topUsers = Array.from(userAgg.entries())
      .map(([userId, v]) => ({
        user: userMap.get(userId) ?? { id: userId, name: null, email: null, image: null },
        attempts: v.attempts,
        avgPct: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 8);

    // ── Hardest questions (lowest accuracy, min 5 answers across all users) ──
    const ranked = questionAgg
      .map((q) => {
        const correct = q._sum.timesCorrect ?? 0;
        const wrong = q._sum.timesWrong ?? 0;
        const total = correct + wrong;
        return { questionId: q.questionId, correct, total, accuracy: total > 0 ? correct / total : 0 };
      })
      .filter((q) => q.total >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);

    const hardestQuestionRows = ranked.length
      ? await ctx.db.question.findMany({
          where: { id: { in: ranked.map((r) => r.questionId) } },
          select: {
            id: true,
            text: true,
            topic: { select: { name: true, subject: { select: { name: true } } } },
          },
        })
      : [];
    const qRowMap = new Map(hardestQuestionRows.map((q) => [q.id, q]));
    const hardestQuestions = ranked.map((r) => {
      const row = qRowMap.get(r.questionId);
      return {
        questionId: r.questionId,
        text: row?.text ?? "—",
        topicName: row?.topic.name ?? "—",
        subjectName: row?.topic.subject.name ?? "—",
        accuracyPct: Math.round(r.accuracy * 100),
        totalAnswered: r.total,
      };
    });

    return {
      overview: {
        totalUsers,
        adminCount,
        newUsers7d,
        activeToday: activeTodayRows.length,
        active7d: active7dRows.length,
        totalAttempts,
        attemptsToday,
        avgScore,
        totalAnswers,
        overallAccuracy,
      },
      trend,
      subjectPerformance,
      topUsers,
      hardestQuestions,
    };
  }),
});

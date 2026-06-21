"use client";

import { api } from "~/trpc/react";
import { ACTIVITY_META, describeActivity, type ActivityType } from "~/lib/activity";
import { usePersonalization } from "~/components/student/PersonalizationProvider";

export default function AktivitasPage() {
  const msgs = usePersonalization();
  const stats = api.activity.getMyStats.useQuery();
  const feed = api.activity.getMine.useInfiniteQuery(
    { limit: 30 },
    { getNextPageParam: (last) => last.nextCursor },
  );

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const maxDay = Math.max(1, ...(stats.data?.perDay.map((d) => d.count) ?? [1]));

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aktivitasmu 🐾</h1>
        <p className="text-muted-foreground text-sm mt-1">{msgs.aktivitasSubtitle}</p>
      </div>

      {/* Ringkasan */}
      {stats.data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Aktivitas" value={stats.data.total} icon="✨" box="bg-primary/10 border-primary/20" />
          <StatCard label="Hari Aktif (14 hari)" value={stats.data.activeDaysLast14} icon="🔥" box="bg-amber-500/10 border-amber-500/20" />
          <StatCard
            label="Jenis Aktivitas"
            value={stats.data.byType.length}
            icon="🎛"
            box="bg-violet-500/10 border-violet-500/20"
          />
        </div>
      )}

      {/* Grafik 14 hari */}
      {stats.data && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Aktivitas 14 Hari Terakhir
          </h2>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-end justify-between gap-1 h-32">
              {stats.data.perDay.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end justify-center h-28">
                    <div
                      className="w-full max-w-[20px] rounded-t bg-primary/70 group-hover:bg-primary transition-colors"
                      style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                      title={`${d.count} aktivitas`}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground tabular-nums">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rincian per jenis */}
      {stats.data && stats.data.byType.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rincian</h2>
          <div className="flex flex-wrap gap-2">
            {stats.data.byType.map((b) => {
              const meta = ACTIVITY_META[b.type as ActivityType] ?? ACTIVITY_META.OTHER;
              return (
                <span
                  key={b.type}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${meta.box}`}
                >
                  <span>{meta.icon}</span>
                  {meta.verb}
                  <span className="opacity-70">· {b.count}</span>
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Feed */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Linimasa</h2>
        {feed.isLoading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas. Mulai belajar yuk, nanti kelihatan di sini 🌱
          </div>
        ) : (
          <ActivityTimeline items={items} />
        )}

        {feed.hasNextPage && (
          <button
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {feed.isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
          </button>
        )}
      </section>
    </div>
  );
}

function ActivityTimeline({
  items,
}: {
  items: { id: number; type: ActivityType; label: string | null; meta: unknown; createdAt: Date | string }[];
}) {
  // Group by day for readable section headers.
  const groups: { day: string; rows: typeof items }[] = [];
  for (const it of items) {
    const day = dayLabel(it.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(it);
    else groups.push({ day, rows: [it] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.day} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{g.day}</p>
          <div className="space-y-2">
            {g.rows.map((it) => {
              const meta = ACTIVITY_META[it.type] ?? ACTIVITY_META.OTHER;
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
                >
                  <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-base border ${meta.box}`}>
                    {meta.icon}
                  </div>
                  <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                    {describeActivity(it)}
                  </p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
                    {timeLabel(it.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, box }: { label: string; value: number; icon: string; box: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border ${box}`}>{icon}</div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-card border border-border animate-pulse" />
      ))}
    </div>
  );
}

function dayLabel(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return "Hari ini";
  if (sameDay(date, yest)) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function timeLabel(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}

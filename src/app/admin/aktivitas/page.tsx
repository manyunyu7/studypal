"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  ACTIVITY_META,
  ACTIVITY_TYPES,
  describeActivity,
  type ActivityType,
} from "~/lib/activity";

export default function AdminAktivitasPage() {
  const [userId, setUserId] = useState<string>("");
  const [type, setType] = useState<string>("");

  const stats = api.activity.getGlobalStats.useQuery();
  const users = api.user.getAll.useQuery();
  const feed = api.activity.getAll.useInfiniteQuery(
    {
      limit: 40,
      userId: userId || undefined,
      type: (type || undefined) as ActivityType | undefined,
    },
    { getNextPageParam: (last) => last.nextCursor },
  );

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const maxDay = Math.max(1, ...(stats.data?.perDay.map((d) => d.count) ?? [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Aktivitas User</h1>
        <p className="mt-1 text-muted-foreground">Pantau apa saja yang dilakukan setiap user.</p>
      </div>

      {/* Stat overview */}
      {stats.data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Aktivitas" value={stats.data.total} />
          <StatCard label="User Aktif Hari Ini" value={stats.data.activeToday} />
          <StatCard label="Jenis Aktivitas" value={stats.data.byType.length} />
          <StatCard
            label="Aktivitas Hari Ini"
            value={stats.data.perDay[stats.data.perDay.length - 1]?.count ?? 0}
          />
        </div>
      )}

      {/* 14-day chart + top users */}
      {stats.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              14 Hari Terakhir
            </p>
            <div className="flex h-32 items-end justify-between gap-1">
              {stats.data.perDay.map((d, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className="w-full max-w-[22px] rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                      title={`${d.count} aktivitas`}
                    />
                  </div>
                  <span className="text-[9px] tabular-nums text-muted-foreground">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              User Paling Aktif
            </p>
            <div className="space-y-2">
              {stats.data.topUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              )}
              {stats.data.topUsers.map((t, i) => (
                <div key={t.user.id} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="flex-1 min-w-0 truncate text-foreground">
                    {t.user.name ?? t.user.email ?? "User"}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Semua user</option>
          {users.data?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email ?? u.id}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Semua jenis</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_META[t].verb}
            </option>
          ))}
        </select>
        {(userId || type) && (
          <button
            onClick={() => {
              setUserId("");
              setType("");
            }}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {feed.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card" />
          ))
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas yang cocok dengan filter ini.
          </div>
        ) : (
          items.map((it) => {
            const meta = ACTIVITY_META[it.type as ActivityType] ?? ACTIVITY_META.OTHER;
            return (
              <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-base ${meta.box}`}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{describeActivity(it)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {it.user.name ?? it.user.email ?? "User"}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(it.createdAt)}
                </span>
              </div>
            );
          })
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
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

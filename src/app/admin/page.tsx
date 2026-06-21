"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function AdminDashboard() {
  const { data, isLoading } = api.analytics.getDashboard.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Ringkasan aktivitas & performa belajar semua user.
        </p>
      </div>

      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── Overview counters ── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Total User"
              value={data.overview.totalUsers}
              hint={`${data.overview.adminCount} admin`}
            />
            <StatCard
              label="User Baru (7h)"
              value={data.overview.newUsers7d}
              accent="green"
            />
            <StatCard
              label="Aktif Hari Ini"
              value={data.overview.activeToday}
              hint={`${data.overview.active7d} dalam 7 hari`}
              accent="blue"
            />
            <StatCard
              label="Total Quiz"
              value={data.overview.totalAttempts}
              hint={`${data.overview.attemptsToday} hari ini`}
            />
            <StatCard
              label="Rata-rata Nilai"
              value={`${data.overview.avgScore}%`}
              accent={data.overview.avgScore >= 70 ? "green" : "amber"}
            />
            <StatCard
              label="Akurasi Jawaban"
              value={`${data.overview.overallAccuracy}%`}
              hint={`${data.overview.totalAnswers} jawaban`}
              accent={data.overview.overallAccuracy >= 70 ? "green" : "amber"}
            />
          </div>

          {/* ── 30-day quiz trend + top users ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrendChart trend={data.trend} />
            <TopUsers users={data.topUsers} />
          </div>

          {/* ── Subject performance + hardest questions ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SubjectPerformance rows={data.subjectPerformance} />
            <HardestQuestions rows={data.hardestQuestions} />
          </div>

          {/* ── Quick actions ── */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Aksi Cepat</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ActionCard href="/admin/semester" icon="🗓" title="Kelola Konten" desc="Semester, mata kuliah, topik & soal" />
              <ActionCard href="/admin/users" icon="👥" title="Kelola User" desc="Tambah, reset password, atur role" />
              <ActionCard href="/admin/aktivitas" icon="📈" title="Lihat Aktivitas" desc="Pantau aktivitas semua user" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────── components ──────────────────────── */

const ACCENT: Record<string, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
};

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "green" | "blue" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ? ACCENT[accent] : "text-foreground"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TrendChart({ trend }: { trend: { date: Date | string; count: number; avgPct: number }[] }) {
  const maxCount = Math.max(1, ...trend.map((d) => d.count));
  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quiz 30 Hari Terakhir
      </p>
      <div className="flex h-36 items-end justify-between gap-px">
        {trend.map((d, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full max-w-[14px] rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
              style={{
                height: `${(d.count / maxCount) * 100}%`,
                minHeight: d.count > 0 ? "4px" : "0",
              }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow group-hover:block">
              {new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              {" · "}
              {d.count} quiz
              {d.count > 0 ? ` · ${d.avgPct}%` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopUsers({
  users,
}: {
  users: {
    user: { id: string; name: string | null; email: string | null };
    attempts: number;
    avgPct: number;
  }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Paling Rajin Quiz
      </p>
      <div className="space-y-2">
        {users.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
        {users.map((u, i) => (
          <Link
            key={u.user.id}
            href={`/admin/users/${u.user.id}`}
            className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent"
          >
            <span className="w-4 tabular-nums text-muted-foreground">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate text-foreground">
              {u.user.name ?? u.user.email ?? "User"}
            </span>
            <span className="text-xs text-muted-foreground">{u.avgPct}%</span>
            <span className="w-8 text-right font-semibold tabular-nums text-foreground">
              {u.attempts}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SubjectPerformance({
  rows,
}: {
  rows: { subjectId: number; name: string; icon: string | null; attempts: number; avgPct: number }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Performa per Mata Kuliah
      </p>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Belum ada quiz.</p>}
        {rows.map((r) => (
          <div key={r.subjectId}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">
                {r.icon ? `${r.icon} ` : ""}
                {r.name}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">{r.attempts}×</span>
              <span className="ml-3 w-10 text-right font-semibold tabular-nums text-foreground">
                {r.avgPct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  r.avgPct >= 70 ? "bg-emerald-500" : r.avgPct >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${r.avgPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HardestQuestions({
  rows,
}: {
  rows: {
    questionId: number;
    text: string;
    topicName: string;
    subjectName: string;
    accuracyPct: number;
    totalAnswered: number;
  }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Soal Tersulit
      </p>
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum cukup data (min. 5 jawaban per soal).
          </p>
        )}
        {rows.map((r) => (
          <div key={r.questionId} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                r.accuracyPct < 40
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {r.accuracyPct}%
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-foreground">{r.text}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.subjectName} · {r.topicName} · {r.totalAnswered} jawaban
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <div className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent">
        <span className="text-2xl">{icon}</span>
        <p className="mt-2 font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-xl border border-border bg-card lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

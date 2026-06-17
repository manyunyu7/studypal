"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function RiwayatPage() {
  const { data, isLoading } = api.quiz.getMyHistory.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const summary = data?.summary;

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-5xl">📈</div>
        <h1 className="text-xl font-bold text-foreground">Belum ada riwayat quiz</h1>
        <p className="text-muted-foreground text-sm">
          Yuk mulai ngerjain quiz pertamamu, nanti progressnya muncul di sini 🥰
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Pilih topik
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perjalanan Belajarmu 📈</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Setiap titik di sini bukti usahamu. Aku bangga banget sama kamu 🤍
        </p>
      </div>

      {/* Ringkasan */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Sesi" value={summary.totalAttempts} icon="🎯" box="bg-primary/10 border-primary/20" />
          <SummaryCard label="Soal Dikerjakan" value={summary.totalQuestions} icon="📝" box="bg-violet-500/10 border-violet-500/20" />
          <SummaryCard label="Rata-rata Skor" value={summary.avgPercentage} suffix="%" icon="📊" box="bg-emerald-500/10 border-emerald-500/20" />
          <SummaryCard label="Skor Terbaik" value={summary.bestPercentage} suffix="%" icon="🏆" box="bg-amber-500/10 border-amber-500/20" />
        </div>
      )}

      {/* Grafik tren skor */}
      <ScoreChart items={items} />

      {/* Daftar sesi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Riwayat Sesi</h2>
        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between rounded-xl bg-card border border-border p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {it.isTryOut && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5">
                      Try Out
                    </span>
                  )}
                  <p className="text-sm font-medium text-foreground truncate">{it.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(it.createdAt)} · {it.score}/{it.total} benar
                </p>
              </div>
              <span
                className={[
                  "flex-shrink-0 ml-3 rounded-lg px-3 py-1.5 text-sm font-bold border tabular-nums",
                  it.percentage >= 70
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    : it.percentage >= 50
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/25",
                ].join(" ")}
              >
                {it.percentage}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  icon,
  box,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  box: string;
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">
            {value}
            {suffix && <span className="text-base font-normal text-muted-foreground ml-0.5">{suffix}</span>}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border ${box}`}>{icon}</div>
      </div>
    </div>
  );
}

/** Grafik garis skor dari waktu ke waktu — SVG murni, tanpa library. */
function ScoreChart({
  items,
}: {
  items: { id: number; percentage: number; createdAt: Date | string }[];
}) {
  // Ambil maksimal 20 sesi terakhir, urutkan kronologis (lama → baru).
  const pts = [...items].slice(0, 20).reverse();
  if (pts.length < 2) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
        Kerjain minimal 2 sesi quiz buat lihat grafik tren skornya ya 🥰
      </div>
    );
  }

  const W = 600;
  const H = 200;
  const PAD = 28;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const stepX = innerW / (pts.length - 1);
  const y = (pct: number) => PAD + innerH - (pct / 100) * innerH;
  const x = (i: number) => PAD + i * stepX;

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.percentage)}`).join(" ");
  const areaPath = `${linePath} L ${x(pts.length - 1)} ${PAD + innerH} L ${x(0)} ${PAD + innerH} Z`;

  const first = pts[0]!.percentage;
  const last = pts[pts.length - 1]!.percentage;
  const trend = last - first;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tren Skor</h2>
        {trend !== 0 && (
          <span className={`text-xs font-semibold ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend > 0 ? `▲ naik ${trend}%` : `▼ turun ${Math.abs(trend)}%`}
          </span>
        )}
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
          {/* Garis grid horizontal */}
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={PAD} y1={y(g)} x2={W - PAD} y2={y(g)} stroke="currentColor" className="text-border" strokeWidth={1} strokeDasharray="3 4" />
              <text x={4} y={y(g) + 4} className="fill-muted-foreground" fontSize={10}>
                {g}
              </text>
            </g>
          ))}

          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#scoreFill)" />
          <path d={linePath} fill="none" stroke="#ec4899" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {pts.map((p, i) => (
            <circle key={p.id} cx={x(i)} cy={y(p.percentage)} r={3.5} fill="#ec4899" stroke="#fff" strokeWidth={1.5} />
          ))}
        </svg>
      </div>
      {trend > 0 && (
        <p className="text-center text-sm text-pink-400">
          Skormu naik, sayang! Aku bangga banget 🥰 Terus gini ya 💪
        </p>
      )}
    </section>
  );
}

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

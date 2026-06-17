import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { toSlug } from "~/lib/slug";
import { LoveGreeting } from "~/components/student/LoveGreeting";

export const metadata = { title: "Dashboard — StudyPal" };

type Stats = Awaited<ReturnType<typeof api.user.getMyStats>>;

const EMPTY_STATS: Stats = {
  totalQuizAttempts: 0,
  avgScore: 0,
  masteredFlashcards: 0,
  totalFlashcards: 0,
  dueToday: 0,
  streak: 0,
  perTopic: [],
  weakTopics: [],
};

function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Streak",
      value: stats.streak,
      suffix: "hari",
      box: "bg-orange-500/10 border-orange-500/20",
      icon: "🔥",
    },
    {
      label: "Jatuh Tempo",
      value: stats.dueToday,
      suffix: "kartu",
      box: "bg-amber-500/10 border-amber-500/20",
      icon: "📅",
    },
    {
      label: "Rata-rata Skor",
      value: stats.avgScore,
      suffix: "%",
      box: "bg-emerald-500/10 border-emerald-500/20",
      icon: "📊",
    },
    {
      label: "Flashcard Dikuasai",
      value: stats.masteredFlashcards,
      suffix: `/ ${stats.totalFlashcards}`,
      box: "bg-violet-500/10 border-violet-500/20",
      icon: "🧠",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-card border border-border p-5 hover:border-border transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-foreground">
                {card.value}
                <span className="text-base font-normal text-muted-foreground ml-1">{card.suffix}</span>
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border ${card.box}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressSection({ stats }: { stats: Stats }) {
  const topics = stats.perTopic.filter((t) => t.totalQuestions > 0);
  if (topics.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Progress per Topik</h2>
      <div className="space-y-2.5">
        {topics.map((t) => (
          <Link
            key={t.topicId}
            href={`/quiz/${toSlug(t.topicName, t.topicId)}`}
            className="block rounded-xl bg-card border border-border p-4 hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">{t.topicName}</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t.masteredQuestions}/{t.totalQuestions} dikuasai
              </span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                style={{ width: `${t.masteryPct}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WeakSection({ stats }: { stats: Stats }) {
  if (stats.weakTopics.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Perlu Latihan Lagi 💪
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.weakTopics.map((t) => (
          <Link
            key={t.topicId}
            href={`/quiz/${toSlug(t.topicName, t.topicId)}`}
            className="block rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 hover:border-rose-500/40 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground mb-1">{t.topicName}</p>
            <p className="text-xs text-rose-300">Akurasi {t.accuracy}% · {t.weakQuestions} soal salah</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function SemesterList() {
  const semesters = await api.semester.getAll();

  if (semesters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">Belum ada semester yang tersedia.</p>
        <p className="text-muted-foreground text-xs mt-1">Hubungi admin untuk menambahkan materi.</p>
      </div>
    );
  }

  const colors = [
    "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
    "from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
    "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40",
    "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
    "from-rose-500/10 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
    "from-sky-500/10 to-sky-500/5 border-sky-500/20 hover:border-sky-500/40",
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {semesters.map((semester, idx) => (
        <Link
          key={semester.id}
          href={`/semester/${toSlug(semester.name, semester.id)}`}
          className={`group block p-5 rounded-xl border bg-gradient-to-br ${colors[idx % colors.length]} transition-all duration-200 hover:scale-[1.02]`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-xl font-bold text-foreground/80">
              {idx + 1}
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{semester.name}</h3>
          {semester.year && <p className="text-xs text-muted-foreground">{semester.year}</p>}
        </Link>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Kamu";

  let stats: Stats = EMPTY_STATS;
  try {
    stats = await api.user.getMyStats();
  } catch {
    // not logged in or error — show zeros
  }

  void api.semester.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        <div className="space-y-1">
          <LoveGreeting firstName={firstName} />
          <p className="text-muted-foreground text-sm">
            {stats.dueToday > 0
              ? `Ada ${stats.dueToday} flashcard yang perlu kamu ulang hari ini.`
              : "Pilih topik untuk mulai belajar."}
          </p>
        </div>

        <StatsCards stats={stats} />
        <WeakSection stats={stats} />
        <ProgressSection stats={stats} />

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Semester</h2>
          <SemesterList />
        </section>
      </div>
    </HydrateClient>
  );
}

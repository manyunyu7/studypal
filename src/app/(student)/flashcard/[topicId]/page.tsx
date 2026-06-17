"use client";

import { useState, useMemo, use } from "react";
import { api } from "~/trpc/react";
import { FlashCard } from "~/components/flashcard/FlashCard";
import { Button } from "~/components/ui/button";
import { TopicNav } from "~/components/student/TopicNav";
import { cn } from "~/lib/utils";
import { idFromSlug } from "~/lib/slug";

interface FlashcardPageProps {
  params: Promise<{ topicId: string }>;
}

type StudyMode = "due" | "all";

const GRADES = [
  { grade: 0 as const, label: "Lagi", hint: "Lupa", cls: "bg-rose-600 hover:bg-rose-500" },
  { grade: 1 as const, label: "Sulit", hint: "Ragu", cls: "bg-amber-600 hover:bg-amber-500" },
  { grade: 2 as const, label: "Bagus", hint: "Ingat", cls: "bg-emerald-600 hover:bg-emerald-500" },
  { grade: 3 as const, label: "Mudah", hint: "Hafal", cls: "bg-sky-600 hover:bg-sky-500" },
];

export default function FlashcardPage({ params }: FlashcardPageProps) {
  const { topicId: topicIdStr } = use(params);
  const topicId = idFromSlug(topicIdStr);
  const utils = api.useUtils();

  const { data: cards = [], isLoading, refetch } = api.flashcard.getByTopic.useQuery({ topicId });

  const [mode, setMode] = useState<StudyMode>("due");
  const [queue, setQueue] = useState<number[] | null>(null); // flashcard ids
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const reviewMut = api.flashcard.reviewCard.useMutation();

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const dueCards = cards.filter((c) => c.isDue);
  const masteredCount = cards.filter((c) => c.mastered).length;

  function startSession(m: StudyMode) {
    const pool = m === "due" ? cards.filter((c) => c.isDue) : cards;
    const ids = pool.map((c) => c.id);
    // shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    }
    setMode(m);
    setQueue(ids);
    setIsFlipped(false);
    setReviewedCount(0);
    setSessionDone(ids.length === 0);
  }

  function handleGrade(grade: 0 | 1 | 2 | 3) {
    if (!queue || queue.length === 0) return;
    const currentId = queue[0]!;
    reviewMut.mutate({ flashcardId: currentId, grade });
    setReviewedCount((c) => c + 1);

    setQueue((prev) => {
      if (!prev) return prev;
      const rest = prev.slice(1);
      // "Lagi" → ulang lagi di akhir sesi ini
      const next = grade === 0 ? [...rest, currentId] : rest;
      if (next.length === 0) {
        setSessionDone(true);
        void utils.user.getMyStats.invalidate();
        void refetch();
      }
      return next;
    });
    setIsFlipped(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-3xl">📭</p>
          <p className="text-foreground text-lg font-semibold">Belum ada flashcard</p>
          <p className="text-muted-foreground text-sm">Topik ini belum memiliki flashcard.</p>
        </div>
      </div>
    );
  }

  // ── Start screen ──
  if (queue === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-4 py-6">
        <div className="max-w-md w-full mx-auto">
          <TopicNav topicId={topicId} active="flashcard" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-4xl">
            🧠
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Flashcard</h1>
            <p className="text-muted-foreground text-sm">
              Belajar pakai spaced repetition — kartu yang sulit muncul lebih sering.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{cards.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-2xl font-bold text-amber-400">{dueCards.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Perlu Diulang</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-2xl font-bold text-emerald-400">{masteredCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dikuasai</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => startSession("due")}
              disabled={dueCards.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold disabled:opacity-40"
            >
              {dueCards.length === 0
                ? "Tidak ada kartu jatuh tempo 🎉"
                : `Mulai Review (${dueCards.length} kartu)`}
            </Button>
            <Button
              onClick={() => startSession("all")}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-accent hover:text-foreground h-11"
            >
              Pelajari Semua Kartu ({cards.length})
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ── Session complete ──
  if (sessionDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="text-5xl">🎉</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Sesi Selesai!</h1>
            <p className="text-muted-foreground text-sm">
              Kamu mereview <span className="text-foreground font-semibold">{reviewedCount}</span> kali sesi ini.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setQueue(null)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
            >
              Kembali ke Menu
            </Button>
            <Button
              onClick={() => startSession("all")}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-accent hover:text-foreground h-10"
            >
              Pelajari Semua Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cardMap.get(queue[0]!);
  if (!currentCard) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setQueue(null)}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Keluar
          </button>
          <span className="text-muted-foreground text-sm font-medium tabular-nums">
            {queue.length} tersisa · {mode === "due" ? "Review" : "Semua"}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="w-full max-w-2xl">
          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onClick={() => setIsFlipped((f) => !f)}
          />
        </div>

        {/* Grade buttons (only after flip) */}
        <div className="mt-8 w-full max-w-2xl">
          {!isFlipped ? (
            <Button
              onClick={() => setIsFlipped(true)}
              className="w-full bg-accent hover:bg-accent/80 text-foreground h-12 text-base font-semibold border border-border"
            >
              Lihat Jawaban
            </Button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => handleGrade(g.grade)}
                  disabled={reviewMut.isPending}
                  className={cn(
                    "flex flex-col items-center justify-center h-14 rounded-xl text-white font-semibold transition-colors disabled:opacity-60",
                    g.cls,
                  )}
                >
                  <span className="text-sm">{g.label}</span>
                  <span className="text-[10px] font-normal opacity-80">{g.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

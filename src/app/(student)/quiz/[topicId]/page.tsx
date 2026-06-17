"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Progress } from "~/components/ui/progress";
import { QuizOption } from "~/components/quiz/QuizOption";
import { TopicNav } from "~/components/student/TopicNav";
import { Celebration } from "~/components/student/Celebration";
import { QuizLoveNote } from "~/components/student/QuizLoveNote";
import { idFromSlug } from "~/lib/slug";

const LABELS = ["A", "B", "C", "D", "E", "F"];

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type Source = "all" | "wrong" | "bookmarked";
type Mode = "practice" | "exam";

type SetQuestion = {
  id: number;
  text: string;
  explanation: string | null;
  difficulty: Difficulty;
  tag: string | null;
  bookmarked: boolean;
  options: { id: number; text: string; isCorrect: boolean }[];
};

type AnswerResult = {
  questionId: number;
  selectedOptionId: number | null;
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
};

type Phase = "config" | "quiz" | "results";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

const DIFF_LABEL: Record<Difficulty, string> = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
};
const DIFF_BADGE: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  HARD: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

export default function QuizPage({ params }: PageProps) {
  const { topicId: topicIdStr } = use(params);
  const topicId = idFromSlug(topicIdStr);
  const router = useRouter();
  const utils = api.useUtils();

  const [phase, setPhase] = useState<Phase>("config");

  // ── Config ──
  const [length, setLength] = useState(10);
  const [mode, setMode] = useState<Mode>("practice");
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [source, setSource] = useState<Source>("all");
  const [loadingSet, setLoadingSet] = useState(false);

  // ── Session ──
  const [set, setSet] = useState<SetQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<{
    score: number;
    total: number;
    percentage: number;
    answers: AnswerResult[];
  } | null>(null);

  const { data: meta, isLoading: metaLoading } = api.question.getBankMeta.useQuery(
    { topicId },
    { enabled: !isNaN(topicId) },
  );
  const { data: attempts } = api.quiz.getMyAttempts.useQuery(
    { topicId },
    { enabled: !isNaN(topicId) },
  );

  const submitMut = api.quiz.submitAttempt.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setPhase("results");
      void utils.question.getBankMeta.invalidate({ topicId });
      void utils.quiz.getMyAttempts.invalidate({ topicId });
    },
  });
  const bookmarkMut = api.question.toggleBookmark.useMutation();

  const bestScore = attempts
    ? Math.max(0, ...attempts.map((a) => (a.total > 0 ? Math.round((a.score / a.total) * 100) : 0)))
    : 0;

  async function startSession(overrideSource?: Source) {
    const src = overrideSource ?? source;
    setLoadingSet(true);
    try {
      const data = await utils.question.getQuizSet.fetch({
        topicId,
        length,
        difficulty: difficulty === "ALL" ? undefined : difficulty,
        source: src,
      });
      if (!data || data.length === 0) {
        setLoadingSet(false);
        return;
      }
      setSet(data);
      setBookmarks(Object.fromEntries(data.map((q) => [q.id, q.bookmarked])));
      setCurrentIndex(0);
      setSelected({});
      setRevealed(new Set());
      setResults(null);
      setPhase("quiz");
    } finally {
      setLoadingSet(false);
    }
  }

  function handleSelect(q: SetQuestion, optionId: number) {
    if (mode === "practice" && revealed.has(q.id)) return; // locked after reveal
    setSelected((prev) => ({ ...prev, [q.id]: optionId }));
    if (mode === "practice") setRevealed((prev) => new Set(prev).add(q.id));
  }

  function submit() {
    const answers = set.map((q) => ({
      questionId: q.id,
      selectedOptionId: selected[q.id] ?? null,
    }));
    submitMut.mutate({ topicId, answers });
  }

  function handleNext() {
    if (currentIndex < set.length - 1) setCurrentIndex((i) => i + 1);
    else submit();
  }

  function toggleBookmark(q: SetQuestion) {
    setBookmarks((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
    bookmarkMut.mutate({ questionId: q.id });
  }

  // ── Loading meta ──
  if (metaLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!meta || meta.total === 0) {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="text-4xl">📭</div>
        <h2 className="text-xl font-bold text-foreground">Belum ada soal</h2>
        <p className="text-muted-foreground text-sm">Admin belum menambahkan soal untuk topik ini.</p>
        <Button variant="outline" onClick={() => router.back()} className="border-border text-foreground hover:bg-accent">
          Kembali
        </Button>
      </div>
    );
  }

  // ── Config Screen ──
  if (phase === "config") {
    const lengthOptions = [10, 25, 50, meta.total].filter(
      (v, i, arr) => v <= meta.total && arr.indexOf(v) === i,
    );
    const diffOptions: (Difficulty | "ALL")[] = ["ALL", "EASY", "MEDIUM", "HARD"];

    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <TopicNav topicId={topicId} active="quiz" />
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-3xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-foreground">Atur Sesi Quiz</h1>
          <p className="text-muted-foreground text-sm">
            Bank soal: <span className="text-foreground font-semibold">{meta.total} soal</span> · Skor terbaik{" "}
            <span className="text-emerald-400 font-semibold">{bestScore}%</span>
          </p>
        </div>

        {/* Jumlah soal */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jumlah Soal</p>
          <div className="grid grid-cols-4 gap-2">
            {lengthOptions.map((v) => (
              <button
                key={v}
                onClick={() => setLength(v)}
                className={cn(
                  "h-11 rounded-lg border text-sm font-semibold transition-colors",
                  length === v
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-accent border-border text-foreground hover:bg-accent/80",
                )}
              >
                {v === meta.total ? "Semua" : v}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "practice", label: "Latihan", desc: "Feedback langsung" },
              { v: "exam", label: "Ujian", desc: "Nilai di akhir" },
            ] as const).map((m) => (
              <button
                key={m.v}
                onClick={() => setMode(m.v)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  mode === m.v
                    ? "bg-primary/15 border-primary/50"
                    : "bg-accent border-border hover:bg-accent/80",
                )}
              >
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tingkat kesulitan */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tingkat Kesulitan</p>
          <div className="grid grid-cols-4 gap-2">
            {diffOptions.map((d) => {
              const count =
                d === "ALL"
                  ? meta.total
                  : meta.byDifficulty[d];
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={count === 0}
                  className={cn(
                    "h-11 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-30",
                    difficulty === d
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-accent border-border text-foreground hover:bg-accent/80",
                  )}
                >
                  {d === "ALL" ? "Semua" : DIFF_LABEL[d]}
                  <span className="block text-[10px] font-normal opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sumber */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sumber Soal</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "all", label: "Semua", count: meta.total },
              { v: "wrong", label: "Sering Salah", count: meta.wrongCount },
              { v: "bookmarked", label: "Ditandai", count: meta.bookmarkCount },
            ] as const).map((s) => (
              <button
                key={s.v}
                onClick={() => setSource(s.v)}
                disabled={s.count === 0}
                className={cn(
                  "h-11 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-30",
                  source === s.v
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-accent border-border text-foreground hover:bg-accent/80",
                )}
              >
                {s.label}
                <span className="block text-[10px] font-normal opacity-70">{s.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => void startSession()}
            disabled={loadingSet}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
          >
            {loadingSet ? "Menyiapkan..." : "Mulai Quiz"}
          </Button>
          <Link
            href={`/quiz/${topicIdStr}/leaderboard`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-border text-foreground hover:bg-accent hover:text-foreground h-10",
            )}
          >
            Lihat Leaderboard
          </Link>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-accent h-10"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz Session ──
  if (phase === "quiz") {
    const q = set[currentIndex];
    if (!q) return null;
    const progress = ((currentIndex + 1) / set.length) * 100;
    const isLast = currentIndex === set.length - 1;
    const selectedOptionId = selected[q.id];
    const isRevealed = mode === "practice" && revealed.has(q.id);
    const answered = selectedOptionId !== undefined;

    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              Soal {currentIndex + 1} dari {set.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-accent" />
        </div>

        {/* Love note kecil tiap soal 💌 */}
        <QuizLoveNote index={currentIndex} />

        {/* Question card */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", DIFF_BADGE[q.difficulty])}>
                {DIFF_LABEL[q.difficulty]}
              </span>
              {q.tag && <span className="text-[11px] text-muted-foreground">{q.tag}</span>}
            </div>
            <button
              onClick={() => toggleBookmark(q)}
              className={cn(
                "text-xs flex items-center gap-1 transition-colors",
                bookmarks[q.id] ? "text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
              title="Tandai soal"
            >
              {bookmarks[q.id] ? "★" : "☆"} Tandai
            </button>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{q.text}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {q.options.map((option, idx) => {
            let reviewState: "correct" | "wrong" | "neutral" = "neutral";
            if (isRevealed) {
              if (option.isCorrect) reviewState = "correct";
              else if (selectedOptionId === option.id) reviewState = "wrong";
            }
            return (
              <QuizOption
                key={option.id}
                label={LABELS[idx] ?? String(idx + 1)}
                text={option.text}
                isSelected={selectedOptionId === option.id}
                onSelect={() => handleSelect(q, option.id)}
                disabled={isRevealed}
                reviewState={reviewState}
              />
            );
          })}
        </div>

        {/* Practice-mode explanation */}
        {isRevealed && q.explanation && (
          <div className="rounded-lg bg-primary/10 border border-primary/30 px-4 py-3">
            <p className="text-xs text-primary leading-relaxed">
              <span className="font-semibold">Penjelasan: </span>
              {q.explanation}
            </p>
          </div>
        )}

        {/* Next button */}
        <Button
          onClick={handleNext}
          disabled={(mode === "practice" ? !isRevealed : !answered) || submitMut.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-semibold disabled:opacity-50"
        >
          {submitMut.isPending ? "Mengirim..." : isLast ? "Selesai & Lihat Hasil" : "Selanjutnya"}
        </Button>

        {/* Skip (exam mode) */}
        {mode === "exam" && !answered && (
          <button
            onClick={handleNext}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Lewati soal ini
          </button>
        )}

        {submitMut.isError && (
          <p className="text-destructive text-sm text-center">Terjadi kesalahan. Coba lagi.</p>
        )}
      </div>
    );
  }

  // ── Results ──
  if (phase === "results" && results) {
    const { score, total, percentage, answers } = results;
    const isPass = percentage >= 70;
    const wrongCount = answers.filter((a) => !a.isCorrect).length;

    return (
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-8">
        <Celebration percentage={percentage} />
        <div className="rounded-xl bg-card border border-border p-6 text-center space-y-4">
          <div className="text-5xl">{isPass ? "🎉" : "💪"}</div>
          <div>
            <p className="text-4xl font-bold text-foreground">{percentage}%</p>
            <p className="text-muted-foreground text-sm mt-1">
              {score} dari {total} soal benar
            </p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
              isPass
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                : "bg-amber-500/15 text-amber-400 border-amber-500/25",
            )}
          >
            {isPass ? "Lulus" : "Perlu Belajar Lagi"}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {isPass
              ? "Kamu hebat, sayang! Terus pertahankan ya 🥰"
              : "Gapapa salah, pelan-pelan aja. Aku temenin belajar 🤍"}
          </p>
        </div>

        {/* Review */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review Jawaban</h2>
          <div className="space-y-4">
            {set.map((question, qIdx) => {
              const answer = answers.find((a) => a.questionId === question.id);
              if (!answer) return null;
              return (
                <div key={question.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                        answer.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400",
                      )}
                    >
                      {answer.isCorrect ? "✓" : "✗"}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      <span className="text-muted-foreground mr-2">{qIdx + 1}.</span>
                      {question.text}
                    </p>
                  </div>
                  <div className="space-y-1.5 pl-9">
                    {question.options.map((option, oIdx) => {
                      const isCorrect = option.id === answer.correctOptionId;
                      const isSelected = option.id === answer.selectedOptionId;
                      let reviewState: "correct" | "wrong" | "neutral" = "neutral";
                      if (isCorrect) reviewState = "correct";
                      else if (isSelected && !isCorrect) reviewState = "wrong";
                      return (
                        <QuizOption
                          key={option.id}
                          label={LABELS[oIdx] ?? String(oIdx + 1)}
                          text={option.text}
                          isSelected={isSelected}
                          onSelect={() => undefined}
                          disabled
                          reviewState={reviewState}
                        />
                      );
                    })}
                  </div>
                  {answer.explanation && (
                    <div className="pl-9">
                      <div className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                        <p className="text-xs text-primary leading-relaxed">
                          <span className="font-semibold">Penjelasan: </span>
                          {answer.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {wrongCount > 0 && (
            <Button
              onClick={() => void startSession("wrong")}
              disabled={loadingSet}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white h-11 font-semibold"
            >
              {loadingSet ? "Menyiapkan..." : `Ulangi ${wrongCount} Soal yang Salah`}
            </Button>
          )}
          <Button
            onClick={() => setPhase("config")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
          >
            Sesi Baru
          </Button>
          <Link
            href={`/quiz/${topicIdStr}/leaderboard`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-border text-foreground hover:bg-accent hover:text-foreground h-10",
            )}
          >
            Lihat Leaderboard
          </Link>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-accent h-10"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

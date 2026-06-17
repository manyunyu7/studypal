"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Progress } from "~/components/ui/progress";
import { QuizOption } from "~/components/quiz/QuizOption";
import { idFromSlug, toSlug } from "~/lib/slug";

const LABELS = ["A", "B", "C", "D", "E", "F"];

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type SetQuestion = {
  id: number;
  text: string;
  explanation: string | null;
  difficulty: Difficulty;
  tag: string | null;
  topicId: number;
  topicName: string;
  bookmarked: boolean;
  options: { id: number; text: string; isCorrect: boolean }[];
};

type Results = Awaited<ReturnType<ReturnType<typeof api.quiz.submitTryOut.useMutation>["mutateAsync"]>>;

type Phase = "config" | "quiz" | "results";

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

const DIFF_LABEL: Record<Difficulty, string> = { EASY: "Mudah", MEDIUM: "Sedang", HARD: "Sulit" };
const DIFF_BADGE: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  HARD: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

export default function TryOutPage({ params }: PageProps) {
  const { subjectId: subjectIdStr } = use(params);
  const subjectId = idFromSlug(subjectIdStr);
  const router = useRouter();
  const utils = api.useUtils();

  const [phase, setPhase] = useState<Phase>("config");
  const [length, setLength] = useState(25);
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [loadingSet, setLoadingSet] = useState(false);

  const [set, setSet] = useState<SetQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Results | null>(null);

  const { data: meta, isLoading: metaLoading } = api.question.getTryOutMeta.useQuery(
    { subjectId },
    { enabled: !isNaN(subjectId) },
  );

  const submitMut = api.quiz.submitTryOut.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setPhase("results");
      void utils.user.getMyStats.invalidate();
    },
  });

  async function start() {
    setLoadingSet(true);
    try {
      const data = await utils.question.getTryOutSet.fetch({
        subjectId,
        length,
        difficulty: difficulty === "ALL" ? undefined : difficulty,
      });
      if (!data || data.length === 0) return;
      setSet(data);
      setCurrentIndex(0);
      setSelected({});
      setResults(null);
      setPhase("quiz");
    } finally {
      setLoadingSet(false);
    }
  }

  function submit() {
    submitMut.mutate({
      subjectId,
      answers: set.map((q) => ({ questionId: q.id, selectedOptionId: selected[q.id] ?? null })),
    });
  }

  function handleNext() {
    if (currentIndex < set.length - 1) setCurrentIndex((i) => i + 1);
    else submit();
  }

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
        <p className="text-muted-foreground text-sm">Mata kuliah ini belum punya soal untuk try out.</p>
        <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  // ── Config ──
  if (phase === "config") {
    const lengthOptions = [25, 50, 100, meta.total].filter(
      (v, i, arr) => v <= meta.total && arr.indexOf(v) === i,
    );
    const diffOptions: (Difficulty | "ALL")[] = ["ALL", "EASY", "MEDIUM", "HARD"];

    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span className="opacity-50">/</span>
          <Link href={`/subject/${toSlug(meta.subjectName, subjectId)}`} className="hover:text-foreground transition-colors">
            {meta.subjectName}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground font-medium">Try Out</span>
        </nav>
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-3xl">
            🏆
          </div>
          <h1 className="text-2xl font-bold text-foreground">Try Out Akhir</h1>
          <p className="text-muted-foreground text-sm">
            {meta.subjectName} · Soal campuran dari{" "}
            <span className="text-foreground font-semibold">{meta.topicCount} topik</span> ({meta.total} soal)
          </p>
        </div>

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

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tingkat Kesulitan</p>
          <div className="grid grid-cols-4 gap-2">
            {diffOptions.map((d) => {
              const count = d === "ALL" ? meta.total : meta.byDifficulty[d];
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

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <p className="text-xs text-amber-300 leading-relaxed">
            Mode ujian: jawaban dinilai di akhir, lengkap dengan rincian skor <strong>per topik</strong> biar
            kelihatan kamu lemah di mana.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <Button onClick={() => void start()} disabled={loadingSet} className="w-full h-12 text-base font-semibold">
            {loadingSet ? "Menyiapkan..." : "Mulai Try Out"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()} className="w-full h-10">Kembali</Button>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  if (phase === "quiz") {
    const q = set[currentIndex];
    if (!q) return null;
    const progress = ((currentIndex + 1) / set.length) * 100;
    const isLast = currentIndex === set.length - 1;
    const selectedOptionId = selected[q.id];
    const answered = selectedOptionId !== undefined;
    const answeredCount = Object.keys(selected).length;

    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Soal {currentIndex + 1} dari {set.length}</span>
            <span className="text-muted-foreground">{answeredCount} terjawab</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="rounded-xl bg-card border border-border p-6 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
              {q.topicName}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", DIFF_BADGE[q.difficulty])}>
              {DIFF_LABEL[q.difficulty]}
            </span>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{q.text}</p>
        </div>

        <div className="space-y-2.5">
          {q.options.map((option, idx) => (
            <QuizOption
              key={option.id}
              label={LABELS[idx] ?? String(idx + 1)}
              text={option.text}
              isSelected={selectedOptionId === option.id}
              onSelect={() => setSelected((prev) => ({ ...prev, [q.id]: option.id }))}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!answered || submitMut.isPending}
          className="w-full h-11 text-base font-semibold disabled:opacity-50"
        >
          {submitMut.isPending ? "Menilai..." : isLast ? "Selesai & Lihat Hasil" : "Selanjutnya"}
        </Button>
        {!answered && (
          <button onClick={handleNext} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
            Lewati soal ini
          </button>
        )}
      </div>
    );
  }

  // ── Results ──
  if (phase === "results" && results) {
    const { score, total, percentage, answers, byTopic } = results;
    const isPass = percentage >= 70;

    return (
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-8">
        <div className="rounded-xl bg-card border border-border p-6 text-center space-y-4">
          <div className="text-5xl">{isPass ? "🏆" : "💪"}</div>
          <div>
            <p className="text-4xl font-bold text-foreground">{percentage}%</p>
            <p className="text-muted-foreground text-sm mt-1">{score} dari {total} soal benar</p>
          </div>
        </div>

        {/* Per-topic breakdown */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rincian per Topik</h2>
          <div className="space-y-2.5">
            {byTopic.map((t) => {
              const barColor =
                t.percentage >= 70 ? "from-emerald-500 to-emerald-400"
                : t.percentage >= 50 ? "from-amber-500 to-amber-400"
                : "from-rose-500 to-rose-400";
              return (
                <div key={t.topicId} className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{t.topicName}</p>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t.correct}/{t.total} · {t.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-accent overflow-hidden">
                    <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", barColor)} style={{ width: `${t.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {byTopic.length > 0 && byTopic[0]!.percentage < 70 && (
            <Button
              variant="outline"
              onClick={() => router.push(`/quiz/${byTopic[0]!.topicId}`)}
              className="w-full"
            >
              Latih topik terlemah: {byTopic[0]!.topicName}
            </Button>
          )}
        </section>

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
                    <div className="min-w-0">
                      <span className="text-[11px] text-primary">{question.topicName}</span>
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        <span className="text-muted-foreground mr-2">{qIdx + 1}.</span>
                        {question.text}
                      </p>
                    </div>
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
                      <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
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

        <div className="flex flex-col gap-3">
          <Button onClick={() => setPhase("config")} className="w-full h-11 font-semibold">Try Out Lagi</Button>
          <Button variant="ghost" onClick={() => router.back()} className="w-full h-10">Kembali</Button>
        </div>
      </div>
    );
  }

  return null;
}

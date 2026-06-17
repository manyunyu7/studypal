import Link from "next/link";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { buttonVariants } from "~/components/ui/button";
import { TopicNav } from "~/components/student/TopicNav";
import { cn } from "~/lib/utils";
import { idFromSlug, toSlug } from "~/lib/slug";

export const metadata = { title: "Leaderboard — StudyPal" };

interface PageProps {
  params: Promise<{ topicId: string }>;
}

const RANK_STYLES = [
  "text-amber-400 bg-amber-500/10 border-amber-500/25",   // 1st
  "text-foreground bg-accent border-border",      // 2nd
  "text-orange-400 bg-orange-500/10 border-orange-500/25", // 3rd
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({ params }: PageProps) {
  const { topicId } = await params;
  const tId = idFromSlug(topicId);
  if (isNaN(tId)) notFound();

  const [topic, leaderboard] = await Promise.all([
    api.topic.getById({ id: tId }),
    api.quiz.getLeaderboard({ topicId: tId }),
  ]);

  if (!topic) notFound();

  void api.quiz.getLeaderboard.prefetch({ topicId: tId });
  void api.topic.getById.prefetch({ id: tId });

  return (
    <HydrateClient>
      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        <TopicNav topicId={tId} active="leaderboard" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard 🏆</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Peringkat skor terbaik untuk {topic.name}.
          </p>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="text-4xl">🏆</div>
            <p className="text-muted-foreground font-medium">Belum ada peserta</p>
            <p className="text-muted-foreground text-xs">Jadilah yang pertama mengerjakan quiz ini!</p>
            <Link
              href={`/quiz/${toSlug(topic.name, tId)}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 border-border text-foreground hover:bg-accent"
              )}
            >
              Mulai Quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const initials = entry.name
                ? entry.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                : "??";
              const rankStyle = RANK_STYLES[idx] ?? "text-muted-foreground bg-accent border-border";
              const rankEmoji = RANK_EMOJIS[idx];

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    idx < 3
                      ? "bg-card border-border"
                      : "bg-accent border-border"
                  } transition-colors`}
                >
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${rankStyle}`}>
                    {rankEmoji ?? `#${idx + 1}`}
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 border border-border flex-shrink-0">
                      <AvatarImage src={entry.image ?? undefined} alt={entry.name ?? "User"} />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.name ?? "Anonim"}</p>
                      <p className="text-xs text-muted-foreground">{entry.bestScore} / {entry.total} benar</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className={`text-lg font-bold ${
                        entry.percentage >= 80
                          ? "text-emerald-400"
                          : entry.percentage >= 60
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {entry.percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {leaderboard.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Menampilkan skor terbaik per pengguna dari semua percobaan.
          </p>
        )}
      </div>
    </HydrateClient>
  );
}

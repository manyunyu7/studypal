import Link from "next/link";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { idFromSlug, toSlug } from "~/lib/slug";

export const metadata = { title: "Mata Kuliah — StudyPal" };

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { subjectId } = await params;
  const subId = idFromSlug(subjectId);
  if (isNaN(subId)) notFound();

  // Fetch all semesters and subjects to resolve breadcrumb
  const [semesters, topics] = await Promise.all([
    api.semester.getAll(),
    api.topic.getBySubject({ subjectId: subId }),
  ]);

  // Find the subject from its semester's subject list
  let subject: { id: number; name: string; description?: string | null; icon?: string | null; semesterId: number } | null = null;
  let semester: { id: number; name: string } | null = null;

  for (const sem of semesters) {
    const subjects = await api.subject.getBySemester({ semesterId: sem.id });
    const found = subjects.find((s) => s.id === subId);
    if (found) {
      subject = found;
      semester = sem;
      break;
    }
  }

  if (!subject) notFound();

  // Fetch counts for each topic
  const topicsWithCounts = await Promise.all(
    topics.map((t) => api.topic.getById({ id: t.id }))
  );

  void api.topic.getBySubject.prefetch({ subjectId: subId });

  return (
    <HydrateClient>
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          {semester && (
            <>
              <Link href={`/semester/${toSlug(semester.name, semester.id)}`} className="hover:text-foreground transition-colors">
                {semester.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{subject.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
            {subject.icon ?? subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
            {subject.description && (
              <p className="text-muted-foreground text-sm mt-1">{subject.description}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">{topics.length} topik tersedia</p>
          </div>
        </div>

        {/* Try Out + Peta Konsep mata kuliah */}
        {topicsWithCounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/tryout/${toSlug(subject.name, subject.id)}`}
              className="group flex items-center gap-4 p-5 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:border-amber-500/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl flex-shrink-0">
                🏆
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Try Out Akhir</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Soal campuran semua topik + skor per topik.
                </p>
              </div>
            </Link>
            <Link
              href={`/subject/${toSlug(subject.name, subject.id)}/mindmap`}
              className="group flex items-center gap-4 p-5 rounded-xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 hover:border-indigo-500/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-2xl flex-shrink-0">
                🗺️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Peta Konsep</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mindmap besar seluruh topik dalam 1 mata kuliah.
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Topic list */}
        {topicsWithCounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4 text-2xl">
              📂
            </div>
            <p className="text-muted-foreground font-medium">Belum ada topik</p>
            <p className="text-muted-foreground text-xs mt-1">Admin belum menambahkan topik untuk mata kuliah ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topicsWithCounts.map((topic, idx) => {
              if (!topic) return null;
              const questionCount = topic._count?.questions ?? 0;
              const flashcardCount = topic._count?.flashcards ?? 0;

              return (
                <Card key={topic.id} className="bg-card border-border hover:border-border transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Topic info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground">{topic.name}</h3>
                          {topic.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                              </svg>
                              {questionCount} soal
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.25M9 10.25H4.875A1.875 1.875 0 0 0 3 12.125v8.25c0 1.036.84 1.875 1.875 1.875H9" />
                              </svg>
                              {flashcardCount} flashcard
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/quiz/${toSlug(topic.name, topic.id)}`}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 h-8"
                          )}
                        >
                          Quiz
                        </Link>
                        <Link
                          href={`/flashcard/${toSlug(topic.name, topic.id)}`}
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" }),
                            "border-border text-foreground hover:bg-accent hover:text-foreground text-xs px-3 h-8"
                          )}
                        >
                          Flashcard
                        </Link>
                        <Link
                          href={`/mindmap/${toSlug(topic.name, topic.id)}`}
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" }),
                            "border-border text-foreground hover:bg-accent hover:text-foreground text-xs px-3 h-8"
                          )}
                        >
                          Mindmap
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </HydrateClient>
  );
}

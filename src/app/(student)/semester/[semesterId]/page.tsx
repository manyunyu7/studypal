import Link from "next/link";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { idFromSlug } from "~/lib/slug";
import { SubjectGrid } from "~/components/student/SubjectGrid";

export const metadata = { title: "Semester — StudyPal" };

interface PageProps {
  params: Promise<{ semesterId: string }>;
}

export default async function SemesterPage({ params }: PageProps) {
  const { semesterId } = await params;
  const semId = idFromSlug(semesterId);
  if (isNaN(semId)) notFound();

  const [semesters, subjects] = await Promise.all([
    api.semester.getAll(),
    api.subject.getBySemester({ semesterId: semId }),
  ]);

  const semester = semesters.find((s) => s.id === semId);
  if (!semester) notFound();

  void api.subject.getBySemester.prefetch({ semesterId: semId });

  return (
    <HydrateClient>
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground">{semester.name}</span>
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{semester.name}</h1>
          {semester.year && <p className="text-muted-foreground text-sm mt-1">{semester.year}</p>}
          <p className="text-muted-foreground text-sm mt-1">{subjects.length} mata kuliah</p>
        </div>

        {/* Subject grid */}
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4 text-2xl">
              📭
            </div>
            <p className="text-muted-foreground font-medium">Belum ada mata kuliah</p>
            <p className="text-muted-foreground text-xs mt-1">Admin belum menambahkan mata kuliah untuk semester ini.</p>
          </div>
        ) : (
          <SubjectGrid
            subjects={subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
              description: subject.description,
              icon: subject.icon,
              topicCount:
                (subject as typeof subject & { _count?: { topics: number } })._count?.topics ?? 0,
            }))}
          />
        )}
      </div>
    </HydrateClient>
  );
}

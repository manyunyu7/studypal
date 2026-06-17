import Link from "next/link";
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { MindmapView } from "~/components/mindmap/MindmapView";
import { idFromSlug, toSlug } from "~/lib/slug";

export const metadata = { title: "Peta Konsep — StudyPal" };

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectMindmapPage({ params }: PageProps) {
  const { subjectId } = await params;
  const subId = idFromSlug(subjectId);
  if (isNaN(subId)) notFound();

  const nodes = await api.mindmap.getBySubject({ subjectId: subId });

  // First node is the synthetic subject root (id = -1).
  const subjectName = nodes.find((n) => n.id === -1)?.label ?? "Mata Kuliah";

  if (nodes.length <= 1) {
    return (
      <HydrateClient>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Peta konsep belum tersedia</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Belum ada mindmap di topik mana pun untuk mata kuliah ini.
          </p>
        </div>
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <div className="p-6 space-y-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/subject/${toSlug(subjectName, subId)}`} className="hover:text-foreground transition-colors">{subjectName}</Link>
          <span>/</span>
          <span className="text-foreground">Peta Konsep</span>
        </nav>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Peta Konsep — {subjectName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gambaran besar seluruh topik dalam satu mata kuliah. Zoom & geser untuk menjelajah.
          </p>
        </div>

        <MindmapView nodes={nodes} />
      </div>
    </HydrateClient>
  );
}

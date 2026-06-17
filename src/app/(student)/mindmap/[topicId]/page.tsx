import { api, HydrateClient } from "~/trpc/server";
import { MindmapView } from "~/components/mindmap/MindmapView";
import { TopicNav } from "~/components/student/TopicNav";
import { idFromSlug } from "~/lib/slug";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export default async function MindmapPage({ params }: PageProps) {
  const { topicId } = await params;
  const id = idFromSlug(topicId);

  const nodes = await api.mindmap.getByTopic({ topicId: id });
  void api.topic.getById.prefetch({ id });

  if (nodes.length === 0) {
    return (
      <HydrateClient>
        <div className="p-6">
          <TopicNav topicId={id} active="mindmap" />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-muted-foreground"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Mindmap belum tersedia
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Mindmap belum tersedia untuk topik ini. Silakan hubungi instruktur
            untuk informasi lebih lanjut.
          </p>
        </div>
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <div className="p-6 space-y-6">
        <TopicNav topicId={id} active="mindmap" />
        <div>
          <p className="text-muted-foreground text-sm">
            Visualisasi hubungan antar konsep dalam topik ini.
          </p>
        </div>
        <MindmapView nodes={nodes} />
      </div>
    </HydrateClient>
  );
}

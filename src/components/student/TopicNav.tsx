"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { toSlug } from "~/lib/slug";

type TopicTab = "quiz" | "flashcard" | "mindmap" | "leaderboard";

const TABS: { key: TopicTab; label: string; icon: string; href: (seg: string) => string }[] = [
  { key: "quiz", label: "Quiz", icon: "🎯", href: (seg) => `/quiz/${seg}` },
  { key: "flashcard", label: "Flashcard", icon: "🧠", href: (seg) => `/flashcard/${seg}` },
  { key: "mindmap", label: "Mindmap", icon: "🗺️", href: (seg) => `/mindmap/${seg}` },
  { key: "leaderboard", label: "Peringkat", icon: "🏅", href: (seg) => `/quiz/${seg}/leaderboard` },
];

interface TopicNavProps {
  topicId: number;
  active: TopicTab;
  /** Extra classes for the outer wrapper (e.g. spacing tweaks per page). */
  className?: string;
}

/**
 * Breadcrumb + lateral tab bar for every topic-level page (quiz, flashcard,
 * mindmap, leaderboard). Gives a way back up the hierarchy and lets the user
 * switch study mode for the same topic without drilling from the dashboard.
 */
export function TopicNav({ topicId, active, className }: TopicNavProps) {
  const { data: topic } = api.topic.getById.useQuery(
    { id: topicId },
    { enabled: !isNaN(topicId), staleTime: 60_000 },
  );

  const subject = topic?.subject;
  const semester = subject?.semester;
  // Pretty URL segment for this topic; falls back to bare id until data loads.
  const topicSeg = topic ? toSlug(topic.name, topicId) : String(topicId);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        {semester && (
          <>
            <span className="opacity-50">/</span>
            <Link
              href={`/semester/${toSlug(semester.name, semester.id)}`}
              className="hover:text-foreground transition-colors"
            >
              {semester.name}
            </Link>
          </>
        )}
        {subject && (
          <>
            <span className="opacity-50">/</span>
            <Link
              href={`/subject/${toSlug(subject.name, subject.id)}`}
              className="hover:text-foreground transition-colors"
            >
              {subject.name}
            </Link>
          </>
        )}
        {topic && (
          <>
            <span className="opacity-50">/</span>
            <span className="text-foreground font-medium">{topic.name}</span>
          </>
        )}
      </nav>

      {/* Lateral tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href(topicSeg)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

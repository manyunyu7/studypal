"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { toSlug } from "~/lib/slug";

const SUBJECT_ICONS = ["📚", "🧮", "🔬", "📐", "🌍", "💡", "🎯", "🧠", "📊", "🔭"];

export interface SubjectGridItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  topicCount: number;
}

export function SubjectGrid({ subjects }: { subjects: SubjectGridItem[] }) {
  const byId = new Map(subjects.map((s) => [s.id, s]));

  // Ephemeral, view-only state — resets on reload (one-time).
  const [order, setOrder] = useState<number[]>(() => subjects.map((s) => s.id));
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const visible = order.map((id) => byId.get(id)!).filter((s) => s && !hidden.has(s.id));

  const hide = (id: number) => setHidden((prev) => new Set(prev).add(id));
  const showAll = () => setHidden(new Set());

  const reorder = (dragged: number, target: number) => {
    if (dragged === target) return;
    setOrder((prev) => {
      const arr = prev.filter((id) => id !== dragged);
      const idx = arr.indexOf(target);
      arr.splice(idx, 0, dragged);
      return arr;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((subject, idx) => {
          const icon = subject.icon ?? SUBJECT_ICONS[idx % SUBJECT_ICONS.length] ?? "📚";
          const isDragging = dragId === subject.id;
          const isOver = overId === subject.id && dragId !== subject.id;

          return (
            <div
              key={subject.id}
              draggable
              onDragStart={(e) => {
                setDragId(subject.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overId !== subject.id) setOverId(subject.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === subject.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId !== null) reorder(dragId, subject.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`group relative block cursor-grab active:cursor-grabbing transition-opacity ${
                isDragging ? "opacity-40" : ""
              } ${isOver ? "rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            >
              {/* Hide button — sits above the card link, doesn't navigate */}
              <button
                type="button"
                aria-label={`Sembunyikan ${subject.name}`}
                title="Sembunyikan"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  hide(subject.id);
                }}
                className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100 focus:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>

              <Link
                href={`/subject/${toSlug(subject.name, subject.id)}`}
                draggable={false}
                className="block"
              >
                <Card className="h-full bg-card border-border hover:border-primary/30 hover:bg-accent transition-all duration-200 hover:scale-[1.02]">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                        {icon.length <= 2 ? icon : icon.charAt(0)}
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subject.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                      </svg>
                      {subject.topicCount} topik
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {hidden.size > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <span>{hidden.size} mata kuliah disembunyikan</span>
          <button onClick={showAll} className="font-medium text-primary hover:underline">
            Tampilkan semua
          </button>
        </div>
      )}
    </div>
  );
}

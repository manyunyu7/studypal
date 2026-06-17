/**
 * Activity tracking — single source of truth for activity types, their
 * display metadata, and the path → activity mapping used by the client-side
 * tracker. Shared by the tRPC router (input validation), the client tracker
 * component, and the activity feed UIs so everything stays in sync.
 */

export const ACTIVITY_TYPES = [
  "LOGIN",
  "VIEW_DASHBOARD",
  "VIEW_SEMESTER",
  "VIEW_SUBJECT",
  "VIEW_TOPIC",
  "START_QUIZ",
  "FINISH_QUIZ",
  "REVIEW_FLASHCARD",
  "VIEW_MINDMAP",
  "VIEW_LEADERBOARD",
  "VIEW_HISTORY",
  "OTHER",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Display metadata per activity type: emoji icon + colored badge classes + verb. */
export const ACTIVITY_META: Record<
  ActivityType,
  { icon: string; verb: string; box: string }
> = {
  LOGIN: { icon: "🔑", verb: "Masuk ke StudyPal", box: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  VIEW_DASHBOARD: { icon: "🏠", verb: "Buka dashboard", box: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
  VIEW_SEMESTER: { icon: "🗓", verb: "Lihat semester", box: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
  VIEW_SUBJECT: { icon: "📚", verb: "Buka matkul", box: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  VIEW_TOPIC: { icon: "📖", verb: "Buka topik", box: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  START_QUIZ: { icon: "📝", verb: "Mulai quiz", box: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  FINISH_QUIZ: { icon: "🎯", verb: "Selesai quiz", box: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  REVIEW_FLASHCARD: { icon: "🃏", verb: "Belajar flashcard", box: "bg-pink-500/15 text-pink-400 border-pink-500/25" },
  VIEW_MINDMAP: { icon: "🧠", verb: "Lihat mindmap", box: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
  VIEW_LEADERBOARD: { icon: "🏆", verb: "Lihat peringkat", box: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  VIEW_HISTORY: { icon: "📈", verb: "Lihat riwayat", box: "bg-teal-500/15 text-teal-400 border-teal-500/25" },
  OTHER: { icon: "✨", verb: "Aktivitas", box: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
};

/** Turn a "kebisingan-7" slug segment into a readable label "Kebisingan". */
export function prettyFromSlug(seg: string): string {
  const text = seg.replace(/-\d+$/, "").replace(/-/g, " ").trim();
  if (!text) return "";
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Map a pathname to an activity {type, label}. Returns null for paths we don't
 * want to record (auth pages, admin, api). Label is best-effort from the slug.
 */
export function pathToActivity(
  pathname: string,
): { type: ActivityType; label: string | null } | null {
  const p = pathname.split("?")[0]!.replace(/\/$/, "") || "/";
  const seg = p.split("/").filter(Boolean);

  // Skip non-student / system routes.
  if (p === "/" || seg[0] === "admin" || seg[0] === "api" || seg[0] === "login" || seg[0] === "register") {
    return null;
  }

  const last = seg[seg.length - 1] ?? "";
  const label = prettyFromSlug(last) || null;

  switch (seg[0]) {
    case "dashboard":
      return { type: "VIEW_DASHBOARD", label: null };
    case "riwayat":
      return { type: "VIEW_HISTORY", label: null };
    case "semester":
      return { type: "VIEW_SEMESTER", label: prettyFromSlug(seg[1] ?? "") || null };
    case "subject":
      return seg[2] === "mindmap"
        ? { type: "VIEW_MINDMAP", label: prettyFromSlug(seg[1] ?? "") || null }
        : { type: "VIEW_SUBJECT", label: prettyFromSlug(seg[1] ?? "") || null };
    case "mindmap":
      return { type: "VIEW_MINDMAP", label };
    case "flashcard":
      return { type: "REVIEW_FLASHCARD", label };
    case "quiz":
      return last === "leaderboard"
        ? { type: "VIEW_LEADERBOARD", label: prettyFromSlug(seg[1] ?? "") || null }
        : { type: "START_QUIZ", label: prettyFromSlug(seg[1] ?? "") || null };
    case "tryout":
      return { type: "START_QUIZ", label: prettyFromSlug(seg[1] ?? "") || null };
    case "untukmu":
      return { type: "OTHER", label: "Untukmu" };
    default:
      return { type: "OTHER", label };
  }
}

/** Build a friendly one-line description for a feed entry. */
export function describeActivity(entry: {
  type: ActivityType;
  label?: string | null;
  meta?: unknown;
}): string {
  const meta = (entry.meta ?? {}) as Record<string, unknown>;
  const base = ACTIVITY_META[entry.type]?.verb ?? "Aktivitas";

  if (entry.type === "FINISH_QUIZ") {
    const score = typeof meta.score === "number" ? meta.score : null;
    const total = typeof meta.total === "number" ? meta.total : null;
    const tail = score !== null && total !== null ? ` — ${score}/${total} benar` : "";
    return `${base}${entry.label ? `: ${entry.label}` : ""}${tail}`;
  }

  return entry.label ? `${base}: ${entry.label}` : base;
}

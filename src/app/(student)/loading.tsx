/**
 * Shown automatically by Next.js while a student page's server data is loading
 * or during client-side navigation between student routes. The sidebar (in the
 * layout) stays put; only this content area is replaced.
 */
import { LoveLoadingText } from "~/components/student/LoveLoadingText";

export default function StudentLoading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Top progress shimmer */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-accent">
        <div className="h-full w-1/3 animate-progress rounded-full bg-gradient-to-r from-primary to-violet-500" />
      </div>

      {/* Header skeleton */}
      <div className="mt-8 space-y-3">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-accent" />
        <div className="h-4 w-72 animate-pulse rounded bg-accent/70" />
      </div>

      {/* Card grid skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-border bg-card"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
        <LoveLoadingText />
      </div>
    </div>
  );
}

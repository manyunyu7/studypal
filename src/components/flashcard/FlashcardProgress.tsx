"use client";

interface FlashcardProgressProps {
  mastered: number;
  total: number;
}

export function FlashcardProgress({ mastered, total }: FlashcardProgressProps) {
  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">
          {mastered} dari {total} flashcard sudah hafal
        </span>
        <span className="text-green-400 font-semibold tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

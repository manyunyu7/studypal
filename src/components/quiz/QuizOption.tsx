"use client";

interface QuizOptionProps {
  text: string;
  label: string; // "A", "B", "C", "D"
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  reviewState?: "correct" | "wrong" | "neutral"; // for review mode
}

export function QuizOption({ text, label, isSelected, onSelect, disabled, reviewState }: QuizOptionProps) {
  let containerClass =
    "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  let labelClass =
    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors";

  if (reviewState === "correct") {
    containerClass += " bg-emerald-500/10 border-emerald-500/40";
    labelClass += " bg-emerald-500 text-white";
  } else if (reviewState === "wrong") {
    containerClass += " bg-red-500/10 border-red-500/40";
    labelClass += " bg-red-500 text-white";
  } else if (isSelected) {
    containerClass += " bg-primary/15 border-primary/50";
    labelClass += " bg-primary text-primary-foreground";
  } else {
    containerClass += " bg-accent border-border hover:border-border hover:bg-accent";
    labelClass += " bg-muted text-muted-foreground";
  }

  if (disabled) {
    containerClass += " cursor-default";
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={containerClass}
    >
      <span className={labelClass}>{label}</span>
      <span className="text-sm text-foreground leading-relaxed pt-0.5">{text}</span>
    </button>
  );
}

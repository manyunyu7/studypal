"use client";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
}

export function FlashCard({ front, back, isFlipped, onClick }: FlashCardProps) {
  return (
    <div
      className="w-full max-w-2xl mx-auto cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={onClick}
    >
      <div
        className="relative w-full"
        style={{
          height: "350px",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl bg-card border border-border shadow-2xl flex flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Pertanyaan
          </span>
          <p className="text-foreground text-2xl md:text-3xl font-semibold text-center leading-relaxed">
            {front}
          </p>
          <span className="mt-8 text-xs text-muted-foreground">
            Ketuk untuk melihat jawaban
          </span>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl bg-accent border border-border shadow-2xl flex flex-col items-center justify-center p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Jawaban
          </span>
          <p className="text-foreground text-2xl md:text-3xl font-semibold text-center leading-relaxed">
            {back}
          </p>
          <span className="mt-8 text-xs text-muted-foreground">
            Ketuk untuk kembali
          </span>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ThemeToggle } from "~/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "StudyPal — Masuk",
  description: "Platform belajar interaktif — Quiz, Flashcard, Mindmap",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background flex">
      {/* Theme toggle — selalu tampil */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />
      </div>

      {/* Left panel — visible on md+ */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-12 bg-gradient-to-br from-background via-card to-primary border-r border-border">
        {/* Logo / brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 border border-primary/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-primary"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            StudyPal
          </span>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Platform Belajar
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Belajar lebih{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                smart
              </span>
              , bareng!
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              StudyPal hadir untuk membantu kamu belajar lebih efektif dengan
              quiz interaktif, flashcard pintar, dan mind map yang memudahkan
              pemahamanmu.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              { icon: "quiz", label: "Quiz interaktif dengan umpan balik instan" },
              { icon: "card", label: "Flashcard untuk hafalan yang efisien" },
              { icon: "map", label: "Mind map visual untuk memahami konsep" },
            ].map(({ icon, label }) => (
              <li key={icon} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-3 h-3 text-primary"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <span className="text-sm text-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <div className="space-y-3">
          <blockquote className="text-muted-foreground text-sm italic border-l-2 border-pink-400/50 pl-4">
            &ldquo;Belajar itu lebih ringan kalau dinikmati. Pelan-pelan aja,
            yang penting konsisten.&rdquo;
          </blockquote>
          <p className="text-muted-foreground text-xs">— Henry, buat StudyPal</p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

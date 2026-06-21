import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { NEUTRAL_FALLBACK } from "~/lib/personalization";

export const metadata = { title: "Untukmu 💕 — StudyPal" };

export default async function UntukmuPage() {
  const msgs = await api.personalization.getMine().catch(() => NEUTRAL_FALLBACK);
  const letter = msgs.letter;

  // Nggak punya surat (tone netral / belum di-set) → balik ke dashboard.
  if (!letter) redirect("/dashboard");

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-pink-400/30 bg-gradient-to-br from-pink-500/10 via-card to-violet-500/10 p-8 md:p-10">
        {/* Hiasan hati */}
        <div className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-10 select-none">
          💗
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-500/15 border border-pink-400/30 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-pink-400">
              Surat kecil
            </span>
            <h1 className="text-3xl font-bold text-foreground">{letter.title}</h1>
          </div>

          <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
            {letter.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="pt-2 font-semibold text-foreground">
              Dengan cinta,
              <br />
              {letter.signature} 💛
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-pink-500/15 border border-pink-400/30 px-4 py-2 text-sm font-medium text-pink-400 transition-colors hover:bg-pink-500/25"
            >
              ← Kembali belajar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

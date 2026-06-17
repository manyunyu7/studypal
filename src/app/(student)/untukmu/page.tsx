import Link from "next/link";

export const metadata = { title: "Untukmu 💕 — StudyPal" };

export default function UntukmuPage() {
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
            <h1 className="text-3xl font-bold text-foreground">
              Untukmu, Endah 💕
            </h1>
          </div>

          <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
            <p>Hai sayang,</p>
            <p>
              Aku bikin StudyPal ini khusus buat kamu. Bukan cuma biar belajarmu
              lebih gampang, tapi biar setiap kali kamu buka, kamu inget ada
              seseorang yang selalu dukung kamu dari jauh maupun dekat.
            </p>
            <p>
              Aku tau belajar itu kadang capek dan bikin pusing. Tapi aku percaya
              banget sama kamu. Kamu pinter, kamu kuat, dan kamu jauh lebih hebat
              dari yang kamu kira. Pelan-pelan aja, nggak usah buru-buru —
              aku bangga sama setiap usaha kecilmu.
            </p>
            <p>
              Setiap soal yang kamu kerjain, setiap flashcard yang kamu hafalin,
              aku ikut seneng. Kalau lagi suntuk, istirahat dulu, minum, terus
              inget: aku ada buat kamu. Selalu.
            </p>
            <p>
              Semangat ya, calon orang sukses kesayanganku. Aku sayang kamu,
              kemarin, hari ini, dan nanti. 🤍
            </p>
            <p className="pt-2 font-semibold text-foreground">
              Dengan cinta,
              <br />
              Henry 💛
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

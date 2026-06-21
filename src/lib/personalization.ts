/**
 * Sumber tunggal untuk semua teks "sweet talk" + versi netral.
 *
 * Dulu teks-teks ini tersebar (hardcode) di belasan komponen & halaman.
 * Sekarang dipusatkan di sini dan dipilih berdasarkan `User.tone`:
 *   - SWEET   → versi mesra (default-nya buat Endah 💕)
 *   - NEUTRAL → versi netral/encouragement ringan (user umum)
 *
 * Konten per-user bisa di-override lewat tabel `Personalization`
 * (authorName / letterTitle / letterBody / greeting) via admin UI.
 *
 * `{name}` di dalam string diganti nama panggilan user yang sedang login.
 */

export type Tone = "SWEET" | "NEUTRAL";

/** Override per-user dari tabel Personalization (semua opsional). */
export interface PersonalizationOverrides {
  authorName?: string | null;
  letterTitle?: string | null;
  letterBody?: string | null;
  greeting?: string | null;
}

export interface ResolvedLetter {
  title: string;
  /** Paragraf isi surat (dipisah baris kosong). */
  paragraphs: string[];
  /** Tanda tangan, mis. "Henry". */
  signature: string;
}

/** Bundel teks yang sudah resolved (nama sudah diisi). Dikirim ke client. */
export interface ResolvedMessages {
  tone: Tone;
  authorName: string;
  greetings: {
    morning: string[];
    afternoon: string[];
    evening: string[];
    night: string[];
  };
  encourage: string[];
  quizNotes: string[];
  loadingTexts: string[];
  praises: string[];
  /** Tanda tangan di confetti celebration; null = jangan tampilkan. */
  celebrationSignature: string | null;
  quizResultPass: string;
  quizResultFail: string;
  riwayatSubtitle: string;
  /** Pesan saat tren skor naik; null = jangan tampilkan. */
  riwayatTrendUp: string | null;
  riwayatEmpty: string;
  riwayatChartHint: string;
  aktivitasSubtitle: string;
  /** Footer kecil di sidebar. */
  footer: string;
  /** Surat di /untukmu; null = halaman & menu disembunyikan. */
  letter: ResolvedLetter | null;
}

const DEFAULT_AUTHOR = "Henry";

// ─────────────────────────────────────────────────────────────────────────
// Template SWEET (mesra) — dipindah apa adanya dari komponen lama.
// ─────────────────────────────────────────────────────────────────────────
const SWEET = {
  greetings: {
    morning: [
      "Selamat pagi, cantik ☀️ Udah sarapan belum?",
      "Pagi sayang 🥰 Semoga harimu semanis kamu hari ini",
      "Bangun pagi buat belajar? Keren banget pacarku 😍",
    ],
    afternoon: [
      "Selamat siang, sayang 🌤️ Jangan lupa makan ya",
      "Lagi semangat-semangatnya nih? Aku bangga sama kamu 💛",
      "Siang-siang tetap belajar, calon orang sukses 🔥",
    ],
    evening: [
      "Selamat sore, cinta 🌇 Istirahat dulu kalau capek ya",
      "Sore yang produktif bareng kamu 🥰",
      "Sore-sore belajar, kamu memang yang terbaik 💕",
    ],
    night: [
      "Selamat malam, sayang 🌙 Jangan begadang ya",
      "Belajar malam-malam? Aku temenin dari sini 🤍",
      "Malam ini kamu hebat banget udah mau belajar 😘",
    ],
  },
  encourage: [
    "kamu pasti bisa, aku percaya sama kamu 💪",
    "pelan-pelan aja, yang penting konsisten 🌱",
    "aku selalu dukung kamu, apa pun hasilnya 🤍",
    "satu langkah kecil hari ini, satu langkah lebih dekat ke cita-cita 💫",
    "inget, kamu nggak sendirian — ada aku 💕",
  ],
  quizNotes: [
    "Pelan-pelan aja ya {name}, aku percaya sama kamu 💛",
    "Kamu lagi cantik-cantiknya pas mikir gini 🥰",
    "Inget, aku selalu bangga sama kamu 🤍",
    "Salah nggak apa-apa, yang penting kamu berani coba 💪",
    "Satu soal lagi nih, semangat sayang 🔥",
    "Aku temenin dari sini, jangan nyerah ya {name} 😘",
    "Kamu lebih pinter dari yang kamu kira, beneran ✨",
    "Tarik napas dulu, kamu pasti bisa 🌸",
    "Lagi fokus ya? Lucu deh kamu 😍",
    "Apa pun hasilnya, aku tetap sayang kamu 💕",
    "Otak encer, hati lembut — itu kamu banget 🧠💛",
    "Kerja bagus, terus lanjut ya {name} 🌟",
  ],
  loadingTexts: [
    "Sebentar ya, {name}…",
    "Lagi nyiapin yang terbaik buat kamu, {name} 💛",
    "Tunggu bentar, cantik 🥰",
    "Hampir siap… semangat ya {name} 🔥",
    "Aku temenin nungguin, {name} 🤍",
    "Bentar lagi kelar kok, sayang 😘",
    "{name}, kamu hari ini cantik banget btw ✨",
  ],
  praises: [
    "Pinter banget sih kamu 😍",
    "Wih, otak encer! Bangga banget aku 🥰",
    "Kamu memang yang terbaik, sayang 💕",
    "Keren! Traktir aku dong nilai segini 😘",
    "Calon orang sukses nih 🔥 Aku sayang kamu",
  ],
  celebrationSignature: "— dari {author}, yang sayang kamu 💛",
  quizResultPass: "Kamu hebat, sayang! Terus pertahankan ya 🥰",
  quizResultFail: "Gapapa salah, pelan-pelan aja. Aku temenin belajar 🤍",
  riwayatSubtitle: "Setiap titik di sini bukti usahamu. Aku bangga banget sama kamu 🤍",
  riwayatTrendUp: "Skormu naik, sayang! Aku bangga banget 🥰 Terus gini ya 💪",
  riwayatEmpty: "Yuk mulai ngerjain quiz pertamamu, nanti progressnya muncul di sini 🥰",
  riwayatChartHint: "Kerjain minimal 2 sesi quiz buat lihat grafik tren skornya ya 🥰",
  aktivitasSubtitle: "Semua jejak belajarmu di StudyPal — biar keliatan seberapa rajin kamu 🥰",
  footer: "dibuat dengan ❤️ oleh {author}, buat {name}",
  letterTitle: "Untukmu, {name} 💕",
  letterBody: [
    "Hai sayang,",
    "Aku bikin StudyPal ini khusus buat kamu. Bukan cuma biar belajarmu lebih gampang, tapi biar setiap kali kamu buka, kamu inget ada seseorang yang selalu dukung kamu dari jauh maupun dekat.",
    "Aku tau belajar itu kadang capek dan bikin pusing. Tapi aku percaya banget sama kamu. Kamu pinter, kamu kuat, dan kamu jauh lebih hebat dari yang kamu kira. Pelan-pelan aja, nggak usah buru-buru — aku bangga sama setiap usaha kecilmu.",
    "Setiap soal yang kamu kerjain, setiap flashcard yang kamu hafalin, aku ikut seneng. Kalau lagi suntuk, istirahat dulu, minum, terus inget: aku ada buat kamu. Selalu.",
    "Semangat ya, calon orang sukses kesayanganku. Aku sayang kamu, kemarin, hari ini, dan nanti. 🤍",
  ].join("\n\n"),
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Template NEUTRAL (encouragement ringan) — buat user umum.
// ─────────────────────────────────────────────────────────────────────────
const NEUTRAL = {
  greetings: {
    morning: [
      "Selamat pagi ☀️ Siap belajar hari ini?",
      "Pagi! Semoga harimu produktif 🌱",
      "Mulai pagi dengan belajar, mantap 👏",
    ],
    afternoon: [
      "Selamat siang 🌤️ Jangan lupa istirahat ya",
      "Lagi semangat nih? Pertahankan 💪",
      "Siang-siang tetap belajar, keren 🔥",
    ],
    evening: [
      "Selamat sore 🌇 Istirahat dulu kalau capek ya",
      "Sore yang produktif 👍",
      "Sore-sore belajar, hebat 🌟",
    ],
    night: [
      "Selamat malam 🌙 Jangan begadang ya",
      "Belajar malam? Tetap semangat 🌟",
      "Malam ini kamu rajin banget 👏",
    ],
  },
  encourage: [
    "kamu pasti bisa 💪",
    "pelan-pelan aja, yang penting konsisten 🌱",
    "satu langkah kecil hari ini, satu langkah lebih dekat ke tujuan 💫",
    "tetap semangat ya 🔥",
    "yang penting terus jalan, jangan berhenti 🌟",
  ],
  quizNotes: [
    "Pelan-pelan aja ya {name}, kamu pasti bisa 💪",
    "Tetap fokus ya 🎯",
    "Salah nggak apa-apa, yang penting berani coba 👍",
    "Satu soal lagi nih, semangat 🔥",
    "Jangan nyerah ya {name} 💪",
    "Kamu lebih bisa dari yang kamu kira ✨",
    "Tarik napas dulu, kamu bisa 🌸",
    "Kerja bagus, lanjut ya {name} 🌟",
  ],
  loadingTexts: [
    "Sebentar ya, {name}…",
    "Lagi nyiapin yang terbaik buat kamu 👍",
    "Tunggu bentar ya 🌱",
    "Hampir siap… semangat {name} 🔥",
    "Bentar lagi kelar kok ✨",
  ],
  praises: [
    "Keren banget! 🎉",
    "Hebat, skormu bagus! 👏",
    "Mantap, pertahankan ya 🔥",
    "Luar biasa! 🌟",
    "Kerja bagus! 💪",
  ],
  celebrationSignature: null as string | null,
  quizResultPass: "Kamu hebat! Terus pertahankan ya 🎉",
  quizResultFail: "Gapapa salah, pelan-pelan aja. Tetap semangat belajar 💪",
  riwayatSubtitle: "Setiap titik di sini bukti usahamu. Tetap semangat ya 💪",
  riwayatTrendUp: "Skormu naik! Pertahankan ya 🔥" as string | null,
  riwayatEmpty: "Yuk mulai ngerjain quiz pertamamu, nanti progressnya muncul di sini 🌱",
  riwayatChartHint: "Kerjain minimal 2 sesi quiz buat lihat grafik tren skornya ya 📈",
  aktivitasSubtitle: "Semua jejak belajarmu di StudyPal — biar keliatan seberapa rajin kamu 🔥",
  footer: "dibuat dengan ❤️ oleh {author}",
  letterTitle: null as string | null,
  letterBody: null as string | null,
} as const;

function fill(s: string, name: string, author: string): string {
  return s.replaceAll("{name}", name).replaceAll("{author}", author);
}

function fillAll(arr: readonly string[], name: string, author: string): string[] {
  return arr.map((s) => fill(s, name, author));
}

/**
 * Resolve seluruh teks untuk satu user: pilih template sesuai tone,
 * terapkan override per-user, lalu isi {name}/{author}.
 *
 * @param firstName nama panggilan user (sudah dipotong kata pertama)
 */
export function resolveMessages(
  tone: Tone,
  overrides: PersonalizationOverrides | null,
  firstName: string,
): ResolvedMessages {
  const t = tone === "SWEET" ? SWEET : NEUTRAL;
  const name = firstName?.trim() || "Kamu";
  const author = overrides?.authorName?.trim() || DEFAULT_AUTHOR;

  // Surat: override > default template (sweet punya default, neutral null).
  const rawTitle = overrides?.letterTitle ?? t.letterTitle;
  const rawBody = overrides?.letterBody ?? t.letterBody;
  let letter: ResolvedLetter | null = null;
  if (rawBody && rawBody.trim()) {
    letter = {
      title: fill(rawTitle ?? "Untukmu 💕", name, author),
      paragraphs: rawBody
        .split(/\n\s*\n/)
        .map((p) => fill(p.trim(), name, author))
        .filter(Boolean),
      signature: author,
    };
  }

  return {
    tone,
    authorName: author,
    greetings: {
      morning: fillAll(t.greetings.morning, name, author),
      afternoon: fillAll(t.greetings.afternoon, name, author),
      evening: fillAll(t.greetings.evening, name, author),
      night: fillAll(t.greetings.night, name, author),
    },
    encourage: fillAll(t.encourage, name, author),
    quizNotes: fillAll(t.quizNotes, name, author),
    loadingTexts: fillAll(t.loadingTexts, name, author),
    praises: fillAll(t.praises, name, author),
    celebrationSignature: t.celebrationSignature
      ? fill(t.celebrationSignature, name, author)
      : null,
    quizResultPass: fill(t.quizResultPass, name, author),
    quizResultFail: fill(t.quizResultFail, name, author),
    riwayatSubtitle: fill(t.riwayatSubtitle, name, author),
    riwayatTrendUp: t.riwayatTrendUp ? fill(t.riwayatTrendUp, name, author) : null,
    riwayatEmpty: fill(t.riwayatEmpty, name, author),
    riwayatChartHint: fill(t.riwayatChartHint, name, author),
    aktivitasSubtitle: fill(t.aktivitasSubtitle, name, author),
    footer: fill(t.footer, name, author),
    letter,
  };
}

/** Default netral — fallback aman saat data belum termuat (mis. di context). */
export const NEUTRAL_FALLBACK: ResolvedMessages = resolveMessages("NEUTRAL", null, "Kamu");

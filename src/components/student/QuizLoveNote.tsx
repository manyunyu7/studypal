"use client";

import { useSession } from "next-auth/react";

/**
 * Love note kecil yang nyelip di tiap soal quiz. Beda-beda per soal &
 * dipersonalisasi pakai nama yang lagi login. Biar belajar berasa ditemenin.
 * — Henry 💛  (buat Endah)
 */

// {name} diganti nama panggilan yang lagi login.
const NOTES = [
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
];

export function QuizLoveNote({ index }: { index: number }) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "sayang";

  // Deterministik per soal — biar nggak ganti tiap re-render, tapi tetap
  // beda di tiap nomor soal.
  const note = NOTES[index % NOTES.length]!.replaceAll("{name}", firstName);

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-pink-400/25 bg-pink-500/5 px-4 py-2.5 text-center">
      <span className="text-sm">💌</span>
      <p className="text-xs italic text-pink-400/90">{note}</p>
    </div>
  );
}

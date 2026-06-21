"use client";

import { usePersonalization } from "~/components/student/PersonalizationProvider";

/**
 * Catatan kecil yang nyelip di tiap soal quiz. Beda-beda per soal & ikut tone
 * user (sweet/neutral). Nama sudah di-resolve di server.
 */
export function QuizLoveNote({ index }: { index: number }) {
  const { quizNotes } = usePersonalization();
  if (quizNotes.length === 0) return null;

  // Deterministik per soal — biar nggak ganti tiap re-render, tapi tetap
  // beda di tiap nomor soal.
  const note = quizNotes[index % quizNotes.length]!;

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-pink-400/25 bg-pink-500/5 px-4 py-2.5 text-center">
      <span className="text-sm">💌</span>
      <p className="text-xs italic text-pink-400/90">{note}</p>
    </div>
  );
}

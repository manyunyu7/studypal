"use client";

import { useEffect, useState } from "react";
import { usePersonalization } from "~/components/student/PersonalizationProvider";

/**
 * Pesan loading yang ganti-ganti acak, ikut tone user (sweet/neutral).
 * Nama sudah di-resolve di server lewat PersonalizationProvider.
 */
export function LoveLoadingText() {
  const { loadingTexts } = usePersonalization();
  const [text, setText] = useState(loadingTexts[0] ?? "Sebentar ya…");

  useEffect(() => {
    // mulai dari satu pesan acak
    setText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)] ?? "Sebentar ya…");
  }, [loadingTexts]);

  useEffect(() => {
    const t = setInterval(() => {
      setText((prev) => {
        if (loadingTexts.length < 2) return loadingTexts[0] ?? prev;
        // pilih acak, hindari ngulang pesan yang sama berturut-turut
        let next = prev;
        while (next === prev) {
          next = loadingTexts[Math.floor(Math.random() * loadingTexts.length)]!;
        }
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, [loadingTexts]);

  return <span className="transition-opacity">{text}</span>;
}

"use client";

import { useEffect, useState } from "react";
import { pickFresh } from "~/lib/love-pick";

/**
 * Sapaan manis yang berganti-ganti tiap buka dashboard.
 * Disesuaikan dengan waktu (pagi/siang/sore/malam) lalu dipilih acak.
 * Dibuat Henry buat Endah 💕
 */

const MORNING = [
  "Selamat pagi, cantik ☀️ Udah sarapan belum?",
  "Pagi sayang 🥰 Semoga harimu semanis kamu hari ini",
  "Bangun pagi buat belajar? Keren banget pacarku 😍",
];
const AFTERNOON = [
  "Selamat siang, sayang 🌤️ Jangan lupa makan ya",
  "Lagi semangat-semangatnya nih? Aku bangga sama kamu 💛",
  "Siang-siang tetap belajar, calon orang sukses 🔥",
];
const EVENING = [
  "Selamat sore, cinta 🌇 Istirahat dulu kalau capek ya",
  "Sore yang produktif bareng kamu 🥰",
  "Sore-sore belajar, kamu memang yang terbaik 💕",
];
const NIGHT = [
  "Selamat malam, sayang 🌙 Jangan begadang ya",
  "Belajar malam-malam? Aku temenin dari sini 🤍",
  "Malam ini kamu hebat banget udah mau belajar 😘",
];

const ENCOURAGE = [
  "kamu pasti bisa, aku percaya sama kamu 💪",
  "pelan-pelan aja, yang penting konsisten 🌱",
  "aku selalu dukung kamu, apa pun hasilnya 🤍",
  "satu langkah kecil hari ini, satu langkah lebih dekat ke cita-cita 💫",
  "inget, kamu nggak sendirian — ada aku 💕",
];

export function LoveGreeting({ firstName }: { firstName: string }) {
  // Default deterministik biar nggak hydration mismatch; di-enhance di client.
  const [greeting, setGreeting] = useState(`Halo, ${firstName}! 👋`);
  const [sub, setSub] = useState("Semangat belajar ya 🔥");

  useEffect(() => {
    const h = new Date().getHours();
    const slot = h < 11 ? "morning" : h < 15 ? "afternoon" : h < 19 ? "evening" : "night";
    const bucket = h < 11 ? MORNING : h < 15 ? AFTERNOON : h < 19 ? EVENING : NIGHT;
    setGreeting(`${firstName}, ${pickFresh(`greeting:${slot}`, bucket)}`);
    setSub(pickFresh("encourage", ENCOURAGE));
  }, [firstName]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
      <p className="text-muted-foreground text-sm mt-1">{sub}</p>
    </div>
  );
}

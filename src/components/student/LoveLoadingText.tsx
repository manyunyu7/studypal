"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Pesan loading manis yang ganti-ganti acak & dipersonalisasi pakai nama
 * yang lagi login. Biar Endah nggak bosen pas nungguin 🥰 — Henry 💛
 */

// {name} diganti nama panggilan yang lagi login.
const TEMPLATES = [
  "Sebentar ya, {name}…",
  "Lagi nyiapin yang terbaik buat kamu, {name} 💛",
  "Tunggu bentar, cantik 🥰",
  "Hampir siap… semangat ya {name} 🔥",
  "Aku temenin nungguin, {name} 🤍",
  "Bentar lagi kelar kok, sayang 😘",
  "{name}, kamu hari ini cantik banget btw ✨",
];

function buildMessages(name: string) {
  return TEMPLATES.map((t) => t.replaceAll("{name}", name));
}

export function LoveLoadingText() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "sayang";

  const [messages, setMessages] = useState(() => buildMessages("sayang"));
  const [text, setText] = useState(messages[0]!);

  useEffect(() => {
    const msgs = buildMessages(firstName);
    setMessages(msgs);
    // mulai dari satu pesan acak
    setText(msgs[Math.floor(Math.random() * msgs.length)]!);
  }, [firstName]);

  useEffect(() => {
    const t = setInterval(() => {
      setText((prev) => {
        if (messages.length < 2) return messages[0]!;
        // pilih acak, hindari ngulang pesan yang sama berturut-turut
        let next = prev;
        while (next === prev) {
          next = messages[Math.floor(Math.random() * messages.length)]!;
        }
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, [messages]);

  return <span className="transition-opacity">{text}</span>;
}

"use client";

import { useEffect, useState } from "react";
import { pickFresh } from "~/lib/love-pick";
import { usePersonalization } from "~/components/student/PersonalizationProvider";

/**
 * Sapaan yang berganti-ganti tiap buka dashboard, disesuaikan waktu
 * (pagi/siang/sore/malam). Teksnya ikut tone user (sweet/neutral) dari
 * PersonalizationProvider.
 */
export function LoveGreeting({ firstName }: { firstName: string }) {
  const msgs = usePersonalization();
  // Default deterministik biar nggak hydration mismatch; di-enhance di client.
  const [greeting, setGreeting] = useState(`Halo, ${firstName}! 👋`);
  const [sub, setSub] = useState("Semangat belajar ya 🔥");

  useEffect(() => {
    const h = new Date().getHours();
    const slot = h < 11 ? "morning" : h < 15 ? "afternoon" : h < 19 ? "evening" : "night";
    const bucket = msgs.greetings[slot];
    setGreeting(`${firstName}, ${pickFresh(`greeting:${slot}`, bucket)}`);
    setSub(pickFresh("encourage", msgs.encourage));
  }, [firstName, msgs]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
      <p className="text-muted-foreground text-sm mt-1">{sub}</p>
    </div>
  );
}

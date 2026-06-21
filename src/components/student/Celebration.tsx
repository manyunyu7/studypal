"use client";

import { useEffect, useState } from "react";
import { pickFresh } from "~/lib/love-pick";
import { usePersonalization } from "~/components/student/PersonalizationProvider";

/**
 * Confetti + pesan selamat pas dapet skor bagus 🎉 Teksnya ikut tone user
 * (sweet/neutral). Pure CSS/DOM, tanpa dependency tambahan.
 */

const COLORS = ["#ec4899", "#a855f7", "#f59e0b", "#10b981", "#38bdf8", "#f43f5e"];

export function Celebration({ percentage }: { percentage: number }) {
  const { praises, celebrationSignature } = usePersonalization();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState(praises[0] ?? "Keren banget! 🎉");

  // Cuma muncul kalau skornya bagus (>= 80%)
  useEffect(() => {
    if (percentage >= 80) {
      setMessage(pickFresh("praise", praises));
      setShow(true);
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [percentage, praises]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Confetti */}
      {Array.from({ length: 60 }).map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 10) * 0.15;
        const duration = 2.5 + (i % 5) * 0.4;
        const color = COLORS[i % COLORS.length];
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}

      {/* Pesan sayang */}
      <div className="absolute inset-x-0 top-24 flex justify-center px-4">
        <div className="animate-in fade-in zoom-in duration-500 rounded-2xl border border-pink-400/40 bg-gradient-to-br from-pink-500/90 to-violet-600/90 px-6 py-4 text-center shadow-2xl backdrop-blur">
          <p className="text-lg font-bold text-white">{message}</p>
          {celebrationSignature && (
            <p className="mt-1 text-xs font-medium text-white/80">{celebrationSignature}</p>
          )}
        </div>
      </div>

      <style>{`
        .confetti-piece {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          opacity: 0.9;
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { createContext, useContext } from "react";
import {
  NEUTRAL_FALLBACK,
  type ResolvedMessages,
} from "~/lib/personalization";

/**
 * Menyediakan bundel teks personalisasi (sudah resolved di server) ke semua
 * komponen client di area student, tanpa prop-drilling. Value-nya statis per
 * sesi render — di-fetch sekali di layout (server) lalu diturunkan ke sini.
 */
const PersonalizationContext = createContext<ResolvedMessages>(NEUTRAL_FALLBACK);

export function PersonalizationProvider({
  value,
  children,
}: {
  value: ResolvedMessages;
  children: React.ReactNode;
}) {
  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  return useContext(PersonalizationContext);
}

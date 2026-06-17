"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  DEFAULT_THEME,
  applyTheme,
  mergeConfig,
  readStoredConfig,
  storeConfig,
  type ThemeConfig,
  type ThemeMode,
} from "~/lib/theme";
import { api } from "~/trpc/react";

interface ThemePersonalizationValue {
  config: ThemeConfig;
  mode: ThemeMode;
  /** ubah palet/accent/radius/font — diterapkan live + disimpan */
  update: (patch: Partial<ThemeConfig>) => void;
  /** ubah light/dark/system — disimpan */
  setMode: (mode: ThemeMode) => void;
  /** reset ke tema default */
  reset: () => void;
}

const ThemePersonalizationContext = createContext<ThemePersonalizationValue | null>(null);

export function useThemePersonalization() {
  const ctx = useContext(ThemePersonalizationContext);
  if (!ctx) {
    throw new Error("useThemePersonalization harus dipakai di dalam <ThemePersonalizationProvider>");
  }
  return ctx;
}

export function ThemePersonalizationProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { status } = useSession();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const hydratedFromDb = useRef(false);

  // Muat config awal dari localStorage (instan, sebelum DB merespons).
  useEffect(() => {
    setConfig(readStoredConfig());
  }, []);

  // Terapkan ke <html> setiap kali config berubah.
  useEffect(() => {
    applyTheme(config);
    storeConfig(config);
  }, [config]);

  // Sinkron dari DB sekali saat login (DB = sumber kebenaran lintas device).
  const dbPref = api.user.getThemePreference.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (hydratedFromDb.current) return;
    if (!dbPref.data) return;
    hydratedFromDb.current = true;
    const { mode, ...rest } = dbPref.data;
    setConfig((prev) => mergeConfig(prev, rest));
    if (mode) setTheme(mode);
  }, [dbPref.data, setTheme]);

  const saveToDb = api.user.setThemePreference.useMutation();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: ThemeConfig, mode?: ThemeMode) => {
      if (status !== "authenticated") return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveToDb.mutate({
          preset: next.preset,
          accent: next.accent,
          radius: next.radius,
          font: next.font,
          ...(mode ? { mode } : {}),
        });
      }, 500);
    },
    [saveToDb, status],
  );

  const update = useCallback(
    (patch: Partial<ThemeConfig>) => {
      setConfig((prev) => {
        const next = mergeConfig(prev, patch);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setMode = useCallback(
    (mode: ThemeMode) => {
      setTheme(mode);
      setConfig((prev) => {
        persist(prev, mode);
        return prev;
      });
    },
    [persist, setTheme],
  );

  const reset = useCallback(() => {
    setConfig(DEFAULT_THEME);
    setTheme("system");
    persist(DEFAULT_THEME, "system");
  }, [persist, setTheme]);

  return (
    <ThemePersonalizationContext.Provider
      value={{ config, mode: (theme as ThemeMode) ?? "system", update, setMode, reset }}
    >
      {children}
    </ThemePersonalizationContext.Provider>
  );
}

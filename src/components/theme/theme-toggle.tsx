"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useThemePersonalization } from "~/components/theme/theme-personalization";

/** Tombol cepat untuk toggle terang/gelap. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const { setMode } = useThemePersonalization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      onClick={() => setMode(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

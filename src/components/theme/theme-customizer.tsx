"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import {
  FONT_LABELS,
  PRESETS,
  RADIUS_OPTIONS,
  type ThemeFont,
  type ThemeMode,
} from "~/lib/theme";
import { useThemePersonalization } from "~/components/theme/theme-personalization";

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

const FONTS: ThemeFont[] = ["sans", "serif", "mono", "rounded"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </Label>
  );
}

export function ThemeCustomizer({ trigger }: { trigger?: React.ReactNode }) {
  const { config, mode, update, setMode, reset } = useThemePersonalization();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet>
      <SheetTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="ghost" size="icon" aria-label="Personalisasi tema" />
          )
        }
      >
        {!trigger && <Palette className="h-5 w-5" />}
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Personalisasi Tema
          </SheetTitle>
          <SheetDescription>
            Atur tampilan StudyPal sesukamu. Tersimpan otomatis di akunmu.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          {/* Mode */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Mode</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(({ value, label, icon: Icon }) => {
                const active = mounted && mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset palet */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Warna Tema</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const active = !config.accent && config.preset === preset.slug;
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => update({ preset: preset.slug, accent: null })}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                      active ? "border-primary bg-accent" : "border-border hover:bg-accent",
                    )}
                    title={preset.name}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: preset.swatch }}
                    >
                      {active && <Check className="h-4 w-4 text-white" />}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent kustom */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Warna Kustom</SectionLabel>
            <div className="flex items-center gap-3">
              <label
                className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-lg border border-border"
                style={{ backgroundColor: config.accent ?? "transparent" }}
              >
                <input
                  type="color"
                  value={config.accent ?? "#5b5bf6"}
                  onChange={(e) => update({ accent: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Pilih warna kustom"
                />
                {!config.accent && (
                  <Palette className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                )}
              </label>
              <div className="flex-1 text-xs text-muted-foreground">
                {config.accent
                  ? `Warna kustom aktif (${config.accent})`
                  : "Pilih warna primary sendiri"}
              </div>
              {config.accent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => update({ accent: null })}
                  className="text-xs"
                >
                  Hapus
                </Button>
              )}
            </div>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Sudut</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map((opt) => {
                const active = config.radius === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ radius: opt.value })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-2 text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <span
                      className="h-6 w-6 border-2 border-primary bg-primary/20"
                      style={{ borderRadius: `${opt.value}rem` }}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Font</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((font) => {
                const active = config.font === font;
                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() => update({ font })}
                    className={cn(
                      "rounded-lg border p-2.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {FONT_LABELS[font]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Kembalikan ke default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sistem theming StudyPal.
 *
 * Tema terdiri dari:
 *  - mode    : light | dark | system  (di-handle oleh next-themes via class `.dark`)
 *  - preset  : palet warna brand bawaan (lihat PRESETS)
 *  - accent  : warna primary kustom (hex) yang menimpa preset, opsional
 *  - radius  : kelengkungan sudut global (rem)
 *  - font    : keluarga font UI
 *
 * Semua nilai di atas (selain mode) diterapkan sebagai CSS custom properties
 * pada <html> sehingga ikut berubah live tanpa reload.
 */

export const THEME_STORAGE_KEY = "studypal-theme";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeFont = "sans" | "serif" | "mono" | "rounded";

export interface ThemeConfig {
  preset: string;
  accent: string | null; // hex (#rrggbb) atau null = pakai preset
  radius: number; // rem
  font: ThemeFont;
}

export const DEFAULT_THEME: ThemeConfig = {
  preset: "indigo",
  accent: null,
  radius: 0.625,
  font: "sans",
};

export interface ThemePreset {
  slug: string;
  name: string;
  /** warna primary dalam oklch */
  primary: string;
  /** warna teks di atas primary */
  primaryForeground: string;
  /** swatch untuk preview di UI (hex perkiraan) */
  swatch: string;
}

export const PRESETS: ThemePreset[] = [
  { slug: "indigo", name: "Indigo", primary: "oklch(0.55 0.22 277)", primaryForeground: "oklch(0.985 0 0)", swatch: "#5b5bf6" },
  { slug: "violet", name: "Violet", primary: "oklch(0.55 0.24 293)", primaryForeground: "oklch(0.985 0 0)", swatch: "#8b3df5" },
  { slug: "blue", name: "Biru", primary: "oklch(0.58 0.18 250)", primaryForeground: "oklch(0.985 0 0)", swatch: "#2f76e0" },
  { slug: "teal", name: "Teal", primary: "oklch(0.6 0.12 195)", primaryForeground: "oklch(0.145 0 0)", swatch: "#13a6b0" },
  { slug: "emerald", name: "Emerald", primary: "oklch(0.62 0.15 163)", primaryForeground: "oklch(0.145 0 0)", swatch: "#10b981" },
  { slug: "amber", name: "Amber", primary: "oklch(0.74 0.16 70)", primaryForeground: "oklch(0.205 0 0)", swatch: "#e69a1f" },
  { slug: "rose", name: "Rose", primary: "oklch(0.62 0.22 17)", primaryForeground: "oklch(0.985 0 0)", swatch: "#f43f6b" },
  { slug: "slate", name: "Netral", primary: "oklch(0.4 0.02 270)", primaryForeground: "oklch(0.985 0 0)", swatch: "#4a4f5e" },
];

export const FONT_STACKS: Record<ThemeFont, string> = {
  sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  rounded: 'ui-rounded, "SF Pro Rounded", "Hiragino Sans", system-ui, sans-serif',
};

export const FONT_LABELS: Record<ThemeFont, string> = {
  sans: "Sans (default)",
  serif: "Serif",
  mono: "Monospace",
  rounded: "Rounded",
};

export const RADIUS_OPTIONS: { label: string; value: number }[] = [
  { label: "Tajam", value: 0 },
  { label: "Sedang", value: 0.5 },
  { label: "Default", value: 0.625 },
  { label: "Bulat", value: 1 },
];

/** Tentukan warna teks yang terbaca (terang/gelap) di atas warna hex. */
export function readableForeground(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "oklch(0.985 0 0)";
  const int = parseInt(m[1]!, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  // luminance relatif (sRGB)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "oklch(0.205 0 0)" : "oklch(0.985 0 0)";
}

export function presetBySlug(slug: string): ThemePreset {
  return PRESETS.find((p) => p.slug === slug) ?? PRESETS[0]!;
}

export function resolvePrimary(config: ThemeConfig): { primary: string; foreground: string } {
  if (config.accent) {
    return { primary: config.accent, foreground: readableForeground(config.accent) };
  }
  const preset = presetBySlug(config.preset);
  return { primary: preset.primary, foreground: preset.primaryForeground };
}

/** Terapkan config tema ke elemen <html> (atau elemen lain). */
export function applyTheme(config: ThemeConfig, root: HTMLElement = document.documentElement): void {
  const { primary, foreground } = resolvePrimary(config);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", foreground);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-primary-foreground", foreground);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--radius", `${config.radius}rem`);
  root.style.setProperty("--font-sans", FONT_STACKS[config.font]);
}

export function mergeConfig(base: ThemeConfig, patch: Partial<ThemeConfig>): ThemeConfig {
  return { ...base, ...patch };
}

export function readStoredConfig(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeConfig>) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeConfig(config: ThemeConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* abaikan quota / private mode */
  }
}

/**
 * Script inline yang dijalankan SEBELUM paint untuk mencegah flash tema salah.
 * Membaca config dari localStorage dan menerapkan CSS variables langsung.
 * Sengaja minimal & self-contained (tidak bisa import apa pun).
 */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var fonts = ${JSON.stringify(FONT_STACKS)};
    var presets = ${JSON.stringify(
      Object.fromEntries(PRESETS.map((p) => [p.slug, { p: p.primary, f: p.primaryForeground }])),
    )};
    var def = ${JSON.stringify(DEFAULT_THEME)};
    var raw = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var c = raw ? Object.assign({}, def, JSON.parse(raw)) : def;
    var primary, fg;
    if (c.accent) {
      primary = c.accent;
      var h = c.accent.replace('#','');
      var n = parseInt(h,16);
      var lum = (0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;
      fg = lum > 0.6 ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)';
    } else {
      var pr = presets[c.preset] || presets[def.preset];
      primary = pr.p; fg = pr.f;
    }
    var r = document.documentElement;
    r.style.setProperty('--primary', primary);
    r.style.setProperty('--primary-foreground', fg);
    r.style.setProperty('--ring', primary);
    r.style.setProperty('--sidebar-primary', primary);
    r.style.setProperty('--sidebar-primary-foreground', fg);
    r.style.setProperty('--sidebar-ring', primary);
    r.style.setProperty('--radius', (c.radius != null ? c.radius : def.radius) + 'rem');
    r.style.setProperty('--font-sans', fonts[c.font] || fonts.sans);
  } catch(e){}
})();
`;

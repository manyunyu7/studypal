/**
 * URL slug helpers. We use "pretty-slug + id" URLs, e.g. `/quiz/kebisingan-7`,
 * where the trailing number is the real database id (source of truth) and the
 * text part is purely decorative. This keeps URLs readable without needing a
 * `slug` column in the database, works automatically for new content, and stays
 * backward-compatible with old numeric URLs like `/quiz/7`.
 */

/** Convert arbitrary text into a URL-safe kebab-case string (ascii, no diacritics). */
export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 60)
    .replace(/-+$/g, ""); // re-trim after slice
  return base || "item";
}

/** Build a URL segment that embeds the id, e.g. toSlug("Kebisingan", 7) → "kebisingan-7". */
export function toSlug(name: string | null | undefined, id: number): string {
  return `${slugify(name ?? "")}-${id}`;
}

/**
 * Extract the trailing numeric id from a slug segment.
 * "kebisingan-7" → 7, "semester-3-2025-2026-1" → 1, "7" → 7, "abc" → NaN.
 */
export function idFromSlug(slug: string): number {
  const match = /(\d+)$/.exec(slug);
  return match ? parseInt(match[1]!, 10) : NaN;
}

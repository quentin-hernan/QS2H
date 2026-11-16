export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

/** Parse un champ JSON stocké en texte, avec valeur de repli. */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    let v: unknown = JSON.parse(raw);
    if (typeof v === "string") { try { v = JSON.parse(v); } catch { /* chaîne simple */ } } // tolère un ancien double encodage
    return v as T;
  } catch {
    return fallback;
  }
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function isPlaceholder(s: string | undefined | null) {
  return !s || /\[[^\]]+\]/.test(s);
}

export function euro(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " €";
}

export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const v = m ? m[1] : "7A0020";
  return `${parseInt(v.slice(0, 2), 16)} ${parseInt(v.slice(2, 4), 16)} ${parseInt(v.slice(4, 6), 16)}`;
}

/** Éclaircit une couleur pour l'utiliser comme accent sur fond sombre. */
export function lighten(hex: string, amount = 0.38): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(" ").map(Number);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)} ${mix(g)} ${mix(b)}`;
}

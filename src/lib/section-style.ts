/** Réglages d'apparence d'une section de page (fond, placement, animations). Partagé entre l'éditeur visuel, le serveur et le site public. */
export type BgType = "none" | "color" | "gradient" | "image" | "video";
export type BgZone = "full" | "left" | "right" | "top" | "bottom";
export type BgAnim = "none" | "zoom" | "pan" | "parallax" | "fixed" | "gradient";
export type EnterAnim = "none" | "fade" | "up" | "down" | "left" | "right" | "zoom" | "blur";

export type SectionStyle = {
  hidden?: boolean;
  tone?: "" | "light" | "dark";
  padTop?: number | null;
  padBottom?: number | null;
  minH?: number | null; // % de la hauteur d'écran
  bg?: {
    type: BgType;
    color?: string; color2?: string; angle?: number;
    src?: string; fit?: "cover" | "contain"; pos?: "center" | "top" | "bottom" | "left" | "right";
    alpha?: number; // opacité du fond, 10 à 100
    overlay?: number; overlayColor?: "black" | "white"; // voile, 0 à 90
    blur?: number;
    zone?: BgZone; size?: number; radius?: number;
    anim?: BgAnim;
  };
  enter?: { type: EnterAnim; duration?: number; delay?: number };
};
export type StyleEntry = { label: string; style: SectionStyle };
export type StyleMap = Record<string, Record<string, StyleEntry>>; // chemin de page -> index de section -> réglages

export const BG_TYPES: { value: BgType; label: string }[] = [{ value: "none", label: "Aucun" }, { value: "color", label: "Couleur" }, { value: "gradient", label: "Dégradé" }, { value: "image", label: "Image" }, { value: "video", label: "Vidéo" }];
export const BG_ZONES: { value: BgZone; label: string }[] = [{ value: "full", label: "Toute la section" }, { value: "left", label: "Bande verticale à gauche" }, { value: "right", label: "Bande verticale à droite" }, { value: "top", label: "Bande horizontale en haut" }, { value: "bottom", label: "Bande horizontale en bas" }];
export const BG_ANIMS: { value: BgAnim; label: string }[] = [{ value: "none", label: "Aucune" }, { value: "zoom", label: "Zoom lent" }, { value: "pan", label: "Panoramique lent" }, { value: "parallax", label: "Parallaxe au défilement" }, { value: "fixed", label: "Fond fixe (image)" }, { value: "gradient", label: "Dégradé animé" }];
export const ENTER_ANIMS: { value: EnterAnim; label: string }[] = [{ value: "none", label: "Aucune" }, { value: "fade", label: "Fondu" }, { value: "up", label: "Montée" }, { value: "down", label: "Descente" }, { value: "left", label: "Depuis la gauche" }, { value: "right", label: "Depuis la droite" }, { value: "zoom", label: "Zoom" }, { value: "blur", label: "Flou vers net" }];

const oneOf = <T extends string>(v: unknown, list: readonly T[], def: T): T => (list.includes(v as T) ? (v as T) : def);
const num = (v: unknown, min: number, max: number, def: number | null): number | null => { const n = Number(v); return v === null || v === "" || v === undefined || !Number.isFinite(n) ? def : Math.min(max, Math.max(min, Math.round(n))); };
const color = (v: unknown, def: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : def);
const src = (v: unknown) => (typeof v === "string" && /^(\/(?!\/)|https:\/\/)/.test(v) ? v.slice(0, 500) : "");

/** Nettoyage strict (appelé côté serveur avant enregistrement) : valeurs connues et bornées uniquement. */
export function cleanStyle(raw: unknown): SectionStyle {
  const r = (raw ?? {}) as SectionStyle;
  const out: SectionStyle = {};
  if (r.hidden === true) out.hidden = true;
  if (r.tone === "light" || r.tone === "dark") out.tone = r.tone;
  const pt = num(r.padTop, 0, 400, null), pb = num(r.padBottom, 0, 400, null), mh = num(r.minH, 0, 100, null);
  if (pt !== null) out.padTop = pt;
  if (pb !== null) out.padBottom = pb;
  if (mh) out.minH = mh;
  const b = r.bg;
  if (b && b.type && b.type !== "none") {
    const type = oneOf(b.type, ["none", "color", "gradient", "image", "video"] as const, "none");
    out.bg = {
      type,
      color: color(b.color, "#1C1C1C"), color2: color(b.color2, "#2A5587"), angle: num(b.angle, 0, 360, 135)!,
      src: type === "image" || type === "video" ? src(b.src) : "",
      fit: oneOf(b.fit, ["cover", "contain"] as const, "cover"), pos: oneOf(b.pos, ["center", "top", "bottom", "left", "right"] as const, "center"),
      alpha: num(b.alpha, 10, 100, 100)!, overlay: num(b.overlay, 0, 90, 0)!, overlayColor: oneOf(b.overlayColor, ["black", "white"] as const, "black"),
      blur: num(b.blur, 0, 24, 0)!, zone: oneOf(b.zone, ["full", "left", "right", "top", "bottom"] as const, "full"), size: num(b.size, 20, 100, 100)!, radius: num(b.radius, 0, 80, 0)!,
      anim: oneOf(b.anim, ["none", "zoom", "pan", "parallax", "fixed", "gradient"] as const, "none"),
    };
  }
  const e = r.enter;
  if (e && e.type && e.type !== "none") out.enter = { type: oneOf(e.type, ["none", "fade", "up", "down", "left", "right", "zoom", "blur"] as const, "none"), duration: num(e.duration, 200, 3000, 800)!, delay: num(e.delay, 0, 3000, 0)! };
  return out;
}

export const isEmptyStyle = (s: SectionStyle) => Object.keys(s).length === 0;
export const isVideoUrl = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);

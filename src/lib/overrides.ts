/** Textes et images modifiés directement sur la page depuis l'éditeur d'apparence (double-clic sur un texte, clic sur une image). */
export type OvEntry = { o: string; v: string };
export type PageOverrides = { t?: Record<string, OvEntry>; m?: Record<string, OvEntry> };
export type OverridesMap = Record<string, PageOverrides>;

const TEXT_SEL = "h1,h2,h3,h4,h5,p,li,dt,dd,figcaption,blockquote,summary,label,th,td,.eyebrow,a,button,a > span,button > span";
const SKIP = "#sx-panel,#sx-toggle,dialog,[contenteditable],.wr,.sx-skip,.preloader,[data-header]";

const roots = () => [document.getElementById("contenu"), document.querySelector("footer")].filter(Boolean) as HTMLElement[];

/** Éléments texte modifiables : texte pur (sans élément enfant), au moins une lettre. L'ordre dans la page sert d'identifiant. */
export function textTargets(): HTMLElement[] {
  const out: HTMLElement[] = [];
  const seen = new Set<Element>();
  for (const r of roots()) for (const el of Array.from(r.querySelectorAll<HTMLElement>(TEXT_SEL))) {
    if (seen.has(el)) continue;
    seen.add(el);
    if (el.children.length || el.closest(SKIP)) continue;
    if (!/\p{L}/u.test(el.textContent || "")) continue;
    out.push(el);
  }
  return out;
}

/** Images et vidéos remplaçables (hors emplacements d'image et fonds de section, gérés ailleurs). */
export function mediaTargets(): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const r of roots()) for (const el of Array.from(r.querySelectorAll<HTMLElement>("img, video"))) {
    if (el.closest(".slot, .sx-bg, #sx-panel, dialog, .sx-skip")) continue;
    out.push(el);
  }
  return out;
}
export const mediaSrc = (el: HTMLElement) => el.getAttribute("src") || "";

export function applyOverrides(ov: PageOverrides | undefined) {
  if (!ov) return;
  if (ov.t) {
    const list = textTargets();
    for (const [i, e] of Object.entries(ov.t)) {
      const el = list[Number(i)];
      if (el && (el.textContent || "").trim() === e.o) { el.textContent = e.v; el.dataset.ovDone = e.v; }
    }
  }
  if (ov.m) {
    const list = mediaTargets();
    for (const [i, e] of Object.entries(ov.m)) {
      const el = list[Number(i)];
      if (!el || el.dataset.ovDone === e.v) continue;
      if ((el.dataset.ovOrig ?? mediaSrc(el)) !== e.o) continue;
      el.dataset.ovOrig = e.o;
      el.dataset.ovDone = e.v;
      el.setAttribute("src", e.v);
      el.removeAttribute("srcset");
      el.removeAttribute("sizes");
      if (el instanceof HTMLVideoElement) el.load();
    }
  }
}

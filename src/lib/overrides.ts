/**
 * Modifications faites directement sur les pages (éditeur visuel) ou depuis l'admin « Apparence des pages ».
 * Les éléments d'origine sont repérés par leur rang dans la page + leur contenu d'origine (`o`) : si le contenu
 * change ensuite depuis l'admin (ex. un tarif), la modification directe ne s'applique plus et c'est l'admin qui prime.
 *
 *  t : texte remplacé            { rang: { o, v } }
 *  m : image / vidéo remplacée   { rang: { o, v } }
 *  x : élément supprimé (masqué) { "t:rang" | "m:rang": { o } }
 *  a : zone ajoutée après un élément (texte ou image) ; « transformer » = supprimer + ajouter à la place
 */
export type OvEntry = { o: string; v: string };
export type OvAdd = { id: string; at: string; o: string; k: "img" | "text"; v: string };
export type PageOverrides = { t?: Record<string, OvEntry>; m?: Record<string, OvEntry>; x?: Record<string, { o: string }>; a?: OvAdd[] };
export type OverridesMap = Record<string, PageOverrides>;

const TEXT_SEL = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,summary,label,th,td,small,strong,em,.eyebrow,a,button,a > span,button > span,span";
const SKIP = "#sx-panel,#sx-toggle,#sx-bar,dialog,[contenteditable],.wr,.sx-skip,.preloader,[data-header],[data-ov-gen],script,style,svg,canvas";

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
    if (el.closest(".slot, .sx-bg, #sx-panel, dialog, .sx-skip, [data-ov-gen]")) continue;
    out.push(el);
  }
  return out;
}
export const mediaSrc = (el: HTMLElement) => el.dataset.ovOrig ?? (el.getAttribute("src") || "");
export const isVideo = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);

/** Remplace la source d'une image ou d'une vidéo, y compris dans un <picture> (les <source> prendraient sinon le dessus). */
export function setMediaSrc(el: HTMLElement, url: string) {
  if (el.dataset.ovOrig === undefined) el.dataset.ovOrig = el.getAttribute("src") || "";
  el.setAttribute("src", url);
  el.removeAttribute("srcset");
  el.removeAttribute("sizes");
  el.parentElement?.closest("picture")?.querySelectorAll("source").forEach((s) => s.remove());
  if (el instanceof HTMLVideoElement) el.load();
}

/** Bloc à masquer pour un élément (une image dans <picture> ou <figure> : on masque l'ensemble). */
export const hideBox = (el: HTMLElement) => (el.tagName === "IMG" || el.tagName === "VIDEO" ? (el.closest("picture") as HTMLElement | null) ?? el : el);

/** Crée l'élément d'une zone ajoutée. `like` : élément texte voisin dont on reprend la typographie. */
export function buildAdded(a: OvAdd, like?: HTMLElement | null): HTMLElement {
  let el: HTMLElement;
  if (a.k === "img") {
    if (isVideo(a.v)) {
      const v = document.createElement("video");
      Object.assign(v, { autoplay: true, muted: true, loop: true, playsInline: true });
      v.src = a.v;
      el = v;
    } else {
      const i = document.createElement("img");
      i.src = a.v; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
      el = i;
    }
    el.className = "ov-media";
  } else {
    const tag = like && /^(H[1-6]|P|LI|DT|DD|BLOCKQUOTE|FIGCAPTION)$/.test(like.tagName) ? like.tagName.toLowerCase() : "p";
    el = document.createElement(tag);
    if (like && like.tagName.toLowerCase() === tag) el.className = like.className;
    el.classList.add("ov-text");
    el.textContent = a.v;
  }
  el.dataset.ovGen = a.id;
  return el;
}

/** Retrouve l'élément d'origine désigné par « t:12 » / « m:3 », s'il correspond toujours au contenu enregistré. */
export function anchorOf(key: string, o: string, lists?: { t: HTMLElement[]; m: HTMLElement[] }): HTMLElement | null {
  const [k, n] = key.split(":");
  const list = k === "t" ? (lists?.t ?? textTargets()) : (lists?.m ?? mediaTargets());
  const el = list[Number(n)];
  if (!el) return null;
  const cur = k === "t" ? (el.dataset.ovText ?? (el.textContent || "").trim()) : mediaSrc(el);
  return cur === o ? el : null;
}

export function applyOverrides(ov: PageOverrides | undefined) {
  if (!ov) return;
  // les listes sont calculées une seule fois, avant toute modification : les rangs restent stables
  const lists = { t: textTargets(), m: mediaTargets() };
  if (ov.t) for (const [i, e] of Object.entries(ov.t)) {
    const el = lists.t[Number(i)];
    if (!el) continue;
    const orig = el.dataset.ovText ?? (el.textContent || "").trim();
    if (orig !== e.o) continue;
    el.dataset.ovText = e.o; // contenu d'origine, pour les passes suivantes
    if (el.textContent !== e.v) el.textContent = e.v;
  }
  if (ov.m) for (const [i, e] of Object.entries(ov.m)) {
    const el = lists.m[Number(i)];
    if (!el || mediaSrc(el) !== e.o || el.getAttribute("src") === e.v) continue;
    setMediaSrc(el, e.v);
  }
  if (ov.x) for (const [key, e] of Object.entries(ov.x)) {
    const el = anchorOf(key, e.o, lists);
    if (el) hideBox(el).setAttribute("data-ov-hidden", key);
  }
  if (ov.a) {
    const last = new Map<string, HTMLElement>();
    for (const a of ov.a) {
      const anchor = anchorOf(a.at, a.o, lists);
      if (!anchor) continue;
      const box = hideBox(anchor);
      let el = document.querySelector<HTMLElement>(`[data-ov-gen="${CSS.escape(a.id)}"]`);
      if (!el) el = buildAdded(a, a.at.startsWith("t:") ? anchor : null);
      const after = last.get(a.at) ?? box;
      if (after.nextSibling !== el) after.after(el);
      last.set(a.at, el);
    }
  }
}

/** Nettoie une page de modifications reçue du navigateur (côté serveur). */
export function cleanPageOverrides(raw: unknown): PageOverrides {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, n = 2000) => String(v ?? "").slice(0, n);
  const okUrl = (u: string) => /^(\/|https:\/\/)/.test(u);
  const out: PageOverrides = {};
  const pairs = (src: unknown, media: boolean) => {
    const r: Record<string, OvEntry> = {};
    if (src && typeof src === "object") for (const [k, e] of Object.entries(src as Record<string, { o?: unknown; v?: unknown }>)) {
      if (!/^\d{1,4}$/.test(k) || !e) continue;
      const o = str(e.o), v = str(e.v);
      if (!v || v === o) continue;
      if (media ? !okUrl(v) : !/\p{L}/u.test(v)) continue;
      r[k] = { o, v };
    }
    return Object.keys(r).length ? r : undefined;
  };
  out.t = pairs(p.t, false);
  out.m = pairs(p.m, true);
  if (p.x && typeof p.x === "object") {
    const x: Record<string, { o: string }> = {};
    for (const [k, e] of Object.entries(p.x as Record<string, { o?: unknown }>)) if (/^[tm]:\d{1,4}$/.test(k) && e) x[k] = { o: str(e.o) };
    if (Object.keys(x).length) out.x = x;
  }
  if (Array.isArray(p.a)) {
    const a: OvAdd[] = [];
    for (const e of p.a.slice(0, 200) as Record<string, unknown>[]) {
      if (!e || !/^[tm]:\d{1,4}$/.test(String(e.at)) || !/^[a-z0-9]{4,24}$/.test(String(e.id))) continue;
      const k = e.k === "img" ? "img" : "text";
      const v = str(e.v, 4000);
      if (k === "img" ? !okUrl(v) : !/\p{L}/u.test(v)) continue;
      a.push({ id: String(e.id), at: String(e.at), o: str(e.o), k, v });
    }
    if (a.length) out.a = a;
  }
  for (const k of Object.keys(out) as (keyof PageOverrides)[]) if (out[k] === undefined) delete out[k];
  return out;
}
export const isEmptyOv = (p: PageOverrides) => !p.t && !p.m && !p.x && !p.a;

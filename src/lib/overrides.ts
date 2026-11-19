/**
 * Modifications faites directement sur les pages (éditeur visuel) ou depuis l'admin « Apparence des pages ».
 * Les éléments d'origine sont repérés par leur rang dans la page + leur contenu d'origine (`o`) : si le contenu
 * change ensuite depuis l'admin (ex. un tarif), la modification directe ne s'applique plus et c'est l'admin qui prime.
 *
 *  t : texte remplacé             { rang: { o, v } }
 *  m : image / vidéo remplacée    { rang: { o, v } }
 *  x : élément supprimé (masqué)  { "t:rang" | "m:rang" | "i:rang": { o } }
 *  a : zone ajoutée après un élément (dans le flux de la page) ; avec son style `st`
 *  f : zone libre, posée n'importe où dans une section (x en % de la largeur, y en px depuis le haut de la section)
 *  s : style d'un élément d'origine (déplacement, taille, police, alignement…) { "t:rang" | "m:rang" | "i:rang": { o, st } }
 */
export type OvEntry = { o: string; v: string };
export type ElStyle = {
  x?: number; y?: number;        // déplacement en px (propriété CSS `translate`, sans casser les animations de la page)
  w?: number;                    // largeur en px
  sc?: number;                   // échelle en % (icônes, boutons)
  fs?: number;                   // taille du texte en px
  ff?: string;                   // police (identifiant de FONTS)
  ta?: "left" | "center" | "right" | "justify";
  b?: 1; i?: 1; u?: 1;           // gras, italique, souligné
  c?: string;                    // couleur #rrggbb
  lh?: number;                   // interligne
};
export type OvAdd = { id: string; at: string; o: string; k: "img" | "text"; v: string; st?: ElStyle };
export type OvFree = { id: string; sec: number; k: "img" | "text"; v: string; x: number; y: number; st?: ElStyle };
export type PageOverrides = {
  t?: Record<string, OvEntry>; m?: Record<string, OvEntry>;
  x?: Record<string, { o: string }>;
  a?: OvAdd[]; f?: OvFree[];
  s?: Record<string, { o: string; st: ElStyle }>;
};
export type OverridesMap = Record<string, PageOverrides>;

export const FONTS: { id: string; label: string; css: string }[] = [
  { id: "sans", label: "Police du site (sans empattement)", css: "var(--font-sans), system-ui, sans-serif" },
  { id: "serif", label: "Police des titres du site", css: "var(--font-serif), system-ui, sans-serif" },
  { id: "georgia", label: "Georgia", css: "Georgia, 'Times New Roman', serif" },
  { id: "times", label: "Times New Roman", css: "'Times New Roman', Times, serif" },
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "trebuchet", label: "Trebuchet MS", css: "'Trebuchet MS', Helvetica, sans-serif" },
  { id: "courier", label: "Courier New (machine à écrire)", css: "'Courier New', Courier, monospace" },
  { id: "impact", label: "Impact (affiche)", css: "Impact, 'Arial Narrow', sans-serif" },
];

const TEXT_SEL = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,summary,label,th,td,small,strong,em,.eyebrow,a,button,a > span,button > span,span";
const SKIP = "#sx-panel,#sx-toggle,#sx-bar,#sx-handle,dialog,[contenteditable],.wr,.sx-skip,.preloader,[data-header],[data-ov-gen],script,style,svg,canvas";
const ICON_SKIP = "#sx-panel,#sx-toggle,#sx-bar,#sx-handle,dialog,[data-header],[data-ov-gen],.sx-skip,.preloader,canvas,.slot,.sx-bg";

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

/** Icônes (SVG) déplaçables, agrandissables et supprimables. */
export function iconTargets(): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const r of roots()) for (const el of Array.from(r.querySelectorAll<SVGElement>("svg"))) {
    if (el.closest(ICON_SKIP) || el.parentElement?.closest("svg")) continue;
    out.push(el as unknown as HTMLElement);
  }
  return out;
}
export const iconSig = (el: Element) => ((el.querySelector("path,circle,rect,line,polyline")?.getAttribute("d") || el.getAttribute("viewBox") || "") + "|" + (el.querySelectorAll("*").length)).slice(0, 40);

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

/** Bloc à masquer pour un élément (une image dans <picture> : on masque l'ensemble). */
export const hideBox = (el: HTMLElement) => (el.tagName === "IMG" || el.tagName === "VIDEO" ? (el.closest("picture") as HTMLElement | null) ?? el : el);

const STYLE_PROPS = ["translate", "scale", "width", "max-width", "height", "font-size", "font-family", "text-align", "font-weight", "font-style", "text-decoration", "color", "line-height", "position", "z-index", "display"] as const;
const px = (n: number) => `${Math.round(n * 100) / 100}px`;

/** Applique (ou retire) le style d'un élément. `translate` et `scale` sont des propriétés indépendantes de `transform` : elles ne cassent pas les animations de la page. */
export function applyElStyle(el: HTMLElement, st?: ElStyle, opts: { free?: boolean } = {}) {
  const s = el.style;
  if (el.dataset.ovSt) for (const p of el.dataset.ovSt.split(",")) s.removeProperty(p);
  const set: string[] = [];
  const put = (p: string, v: string) => { s.setProperty(p, v); set.push(p); };
  if (st) {
    const moved = !!(st.x || st.y), scaled = !!(st.sc && st.sc !== 100);
    if (moved) put("translate", `${px(st.x || 0)} ${px(st.y || 0)}`);
    if (scaled) put("scale", String(st.sc! / 100));
    if (st.w) { put("width", px(st.w)); put("max-width", "none"); if (el.tagName === "IMG" || el.tagName === "VIDEO") put("height", "auto"); }
    if (st.fs) put("font-size", px(st.fs));
    if (st.ff) { const f = FONTS.find((x) => x.id === st.ff); if (f) put("font-family", f.css); }
    if (st.ta) put("text-align", st.ta);
    if (st.b) put("font-weight", "700");
    if (st.i) put("font-style", "italic");
    if (st.u) put("text-decoration", "underline");
    if (st.c) put("color", st.c);
    if (st.lh) put("line-height", String(st.lh));
    if ((moved || scaled) && !opts.free) { put("position", "relative"); put("z-index", "4"); }
    // les éléments « en ligne » ignorent translate / scale / width : on les rend « inline-block »
    if ((moved || scaled || st.w) && !opts.free && !(el instanceof SVGElement) && getComputedStyle(el).display === "inline") put("display", "inline-block");
  }
  if (set.length) el.dataset.ovSt = set.join(","); else delete el.dataset.ovSt;
}

/** Zone ajoutée dans le flux de la page. `like` : élément texte voisin dont on reprend la typographie. */
export function buildAdded(a: OvAdd, like?: HTMLElement | null): HTMLElement {
  let el: HTMLElement;
  if (a.k === "img") {
    el = makeMedia(a.v);
    el.className = "ov-media";
  } else {
    const tag = like && /^(H[1-6]|P|LI|DT|DD|BLOCKQUOTE|FIGCAPTION)$/.test(like.tagName) ? like.tagName.toLowerCase() : "p";
    el = document.createElement(tag);
    if (like && like.tagName.toLowerCase() === tag) el.className = like.className;
    el.classList.add("ov-text");
    el.textContent = a.v;
  }
  el.dataset.ovGen = a.id;
  applyElStyle(el, a.st);
  return el;
}

function makeMedia(src: string): HTMLElement {
  if (isVideo(src)) {
    const v = document.createElement("video");
    Object.assign(v, { autoplay: true, muted: true, loop: true, playsInline: true });
    v.src = src;
    return v;
  }
  const i = document.createElement("img");
  i.src = src; i.alt = ""; i.loading = "lazy"; i.decoding = "async";
  return i;
}

/** Zone libre : positionnée où l'on veut dans une section (left en %, top en px). */
export function buildFree(f: OvFree, section: HTMLElement): HTMLElement {
  const el = f.k === "img" ? makeMedia(f.v) : document.createElement("p");
  if (f.k === "img") el.className = "ov-media ov-free"; else { el.className = "ov-text ov-free"; el.textContent = f.v; }
  el.dataset.ovGen = f.id;
  el.dataset.ovFree = "1";
  placeFree(el, f);
  applyElStyle(el, f.st, { free: true });
  section.setAttribute("data-ov-host", "1");
  section.appendChild(el);
  return el;
}
export function placeFree(el: HTMLElement, f: Pick<OvFree, "x" | "y">) {
  el.style.left = `${Math.round(f.x * 100) / 100}%`;
  el.style.top = px(f.y);
}

/** Retrouve l'élément d'origine désigné par « t:12 » / « m:3 » / « i:5 », s'il correspond toujours au contenu enregistré. */
export type Lists = { t: HTMLElement[]; m: HTMLElement[]; i: HTMLElement[] };
export const currentLists = (): Lists => ({ t: textTargets(), m: mediaTargets(), i: iconTargets() });
export function sigOf(key: string, el: HTMLElement): string {
  const k = key[0];
  return k === "t" ? (el.dataset.ovText ?? (el.textContent || "").trim()) : k === "m" ? mediaSrc(el) : iconSig(el);
}
export function anchorOf(key: string, o: string, lists?: Lists): HTMLElement | null {
  const [k, n] = key.split(":");
  const l = lists ?? currentLists();
  const el = (k === "t" ? l.t : k === "m" ? l.m : l.i)[Number(n)];
  if (!el) return null;
  return sigOf(key, el) === o ? el : null;
}

export function applyOverrides(ov: PageOverrides | undefined, sections?: () => HTMLElement[]) {
  if (!ov) return;
  // les listes sont calculées une seule fois, avant toute modification : les rangs restent stables
  const lists = currentLists();
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
  if (ov.s) for (const [key, e] of Object.entries(ov.s)) {
    const el = anchorOf(key, e.o, lists);
    if (el) applyElStyle(el, e.st);
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
  if (ov.f && sections) {
    const secs = sections();
    for (const f of ov.f) {
      const sec = secs[f.sec];
      if (!sec || document.querySelector(`[data-ov-gen="${CSS.escape(f.id)}"]`)) continue;
      buildFree(f, sec);
    }
  }
}

/* ------------------------------------------------------------------ nettoyage côté serveur */
const num = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : undefined; };
export function cleanStyle(raw: unknown): ElStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const st: ElStyle = {};
  const x = num(r.x, -6000, 6000), y = num(r.y, -6000, 6000), w = num(r.w, 20, 3000), sc = num(r.sc, 10, 600), fs = num(r.fs, 8, 240), lh = num(r.lh, 0.8, 3.5);
  if (x) st.x = x; if (y) st.y = y; if (w) st.w = w; if (sc && sc !== 100) st.sc = sc; if (fs) st.fs = fs; if (lh) st.lh = lh;
  if (typeof r.ff === "string" && FONTS.some((f) => f.id === r.ff)) st.ff = r.ff;
  if (r.ta === "left" || r.ta === "center" || r.ta === "right" || r.ta === "justify") st.ta = r.ta;
  if (r.b) st.b = 1; if (r.i) st.i = 1; if (r.u) st.u = 1;
  if (typeof r.c === "string" && /^#[0-9a-fA-F]{6}$/.test(r.c)) st.c = r.c;
  return Object.keys(st).length ? st : undefined;
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
    for (const [k, e] of Object.entries(p.x as Record<string, { o?: unknown }>)) if (/^[tmi]:\d{1,4}$/.test(k) && e) x[k] = { o: str(e.o) };
    if (Object.keys(x).length) out.x = x;
  }
  if (p.s && typeof p.s === "object") {
    const s: Record<string, { o: string; st: ElStyle }> = {};
    for (const [k, e] of Object.entries(p.s as Record<string, { o?: unknown; st?: unknown }>)) {
      if (!/^[tmi]:\d{1,4}$/.test(k) || !e) continue;
      const st = cleanStyle(e.st);
      if (st) s[k] = { o: str(e.o), st };
    }
    if (Object.keys(s).length) out.s = s;
  }
  if (Array.isArray(p.a)) {
    const a: OvAdd[] = [];
    for (const e of p.a.slice(0, 200) as Record<string, unknown>[]) {
      if (!e || !/^[tmi]:\d{1,4}$/.test(String(e.at)) || !/^[a-z0-9]{4,24}$/.test(String(e.id))) continue;
      const k = e.k === "img" ? "img" : "text";
      const v = str(e.v, 4000);
      if (k === "img" ? !okUrl(v) : !/\p{L}/u.test(v)) continue;
      const item: OvAdd = { id: String(e.id), at: String(e.at), o: str(e.o), k, v };
      const st = cleanStyle(e.st); if (st) item.st = st;
      a.push(item);
    }
    if (a.length) out.a = a;
  }
  if (Array.isArray(p.f)) {
    const f: OvFree[] = [];
    for (const e of p.f.slice(0, 200) as Record<string, unknown>[]) {
      if (!e || !/^[a-z0-9]{4,24}$/.test(String(e.id))) continue;
      const k = e.k === "img" ? "img" : "text";
      const v = str(e.v, 4000);
      if (k === "img" ? !okUrl(v) : !/\p{L}/u.test(v)) continue;
      const sec = Math.round(Number(e.sec));
      if (!Number.isInteger(sec) || sec < 0 || sec > 200) continue;
      const item: OvFree = { id: String(e.id), sec, k, v, x: num(e.x, -20, 120) ?? 5, y: num(e.y, -2000, 20000) ?? 20 };
      const st = cleanStyle(e.st); if (st) item.st = st;
      f.push(item);
    }
    if (f.length) out.f = f;
  }
  for (const k of Object.keys(out) as (keyof PageOverrides)[]) if (out[k] === undefined) delete out[k];
  return out;
}
export const isEmptyOv = (p: PageOverrides) => !p.t && !p.m && !p.x && !p.a && !p.f && !p.s;

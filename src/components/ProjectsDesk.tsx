"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useViewer } from "./ProjectViewer";

export type DeskProject = {
  slug: string; title: string; client: string; sector: string; year: number; summary: string; cover: string; url: string; isExample: boolean;
  duration: string; beforeImage: string;
  planes: { id: string; name: string; kind: string; image: string; caption: string }[];
  meta: { lighthouse?: { performance: number; accessibility: number; bestPractices: number; seo: number; source: string } | null; capturedAt?: string };
};
type Dev = "desktop" | "tablet" | "mobile";
type Win = { slug: string; x: number; y: number; w: number; h: number; z: number; min: boolean; dev: Dev; ox: number; oy: number; ba: boolean };

const STEPS = ["Brief", "Maquette", "Développement", "Recette", "Mise en ligne"];

/** Jauge Lighthouse : vraie mesure issue de la capture, animée à l'ouverture. */
function Gauge({ label, v, go }: { label: string; v: number; go: boolean }) {
  const C = 2 * Math.PI * 24;
  return (
    <div className="text-center">
      <svg viewBox="0 0 60 60" className="mx-auto h-14 w-14 -rotate-90" role="img" aria-label={`${label} : ${v} sur 100`}>
        <circle cx="30" cy="30" r="24" fill="none" stroke="rgb(28 28 28 / .12)" strokeWidth="5" />
        <circle cx="30" cy="30" r="24" fill="none" stroke="rgb(var(--accent))" strokeWidth="5" strokeDasharray={C} strokeDashoffset={go ? C * (1 - v / 100) : C} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <p className="-mt-10 mb-5 text-[0.95rem] font-semibold tabular-nums">{v}</p>
      <p className="muted text-[0.68rem] uppercase tracking-wider">{label}</p>
    </div>
  );
}

/** Capture du site qui défile toute seule, avec un curseur fantôme qui survole et clique. Rôle : montrer le site en usage sans le charger. */
function AutoScroll({ images, alt }: { images: string[]; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  useEffect(() => {
    const m = () => setDist(Math.max(0, (inner.current?.offsetHeight ?? 0) - (box.current?.offsetHeight ?? 0)));
    m();
    const ro = new ResizeObserver(m);
    if (inner.current) ro.observe(inner.current);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [images]);
  return (
    <div ref={box} className="desk-screen relative h-full w-full overflow-hidden bg-white">
      <div ref={inner} className="desk-scroll" style={{ ["--dist" as string]: `-${dist}px`, ["--dur" as string]: `${Math.max(8, dist / 70)}s` }}>
        {images.map((src, i) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={src} src={src} alt={i === 0 ? alt : ""} className="block w-full" loading="lazy" />))}
      </div>
      <svg className="ghost-cursor" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 2l15 9-7 1.6L9 20z" fill="#1C1C1C" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      <span className="ghost-click" aria-hidden="true" />
    </div>
  );
}

function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [v, setV] = useState(50);
  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${title} après refonte`} className="absolute inset-0 h-full w-full object-cover object-top" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt={`${title} avant refonte`} className="absolute inset-0 h-full w-full object-cover object-top" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }} />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-[rgb(var(--accent))]" style={{ left: `${v}%` }} />
      <label className="absolute inset-x-6 bottom-4 flex items-center gap-3 bg-white/90 px-3 py-1 text-[0.75rem] font-medium uppercase tracking-wider"><span>Avant</span><input type="range" min={0} max={100} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label="Curseur avant / après" className="h-8 flex-1 accent-[rgb(42,85,135)]" /><span>Après</span></label>
    </div>
  );
}

export function ProjectsDesk({ projects, onListView }: { projects: DeskProject[]; onListView: () => void }) {
  const viewer = useViewer();
  const desk = useRef<HTMLDivElement>(null);
  const [wins, setWins] = useState<Win[]>([]);
  const [top, setTop] = useState(10);
  const [active, setActive] = useState<string | null>(null);
  const [go, setGo] = useState<string | null>(null);
  const by = (slug: string) => projects.find((p) => p.slug === slug)!;

  const focusWin = useCallback((slug: string) => {
    setActive(slug);
    setTop((t) => t + 1);
    setWins((w) => w.map((x) => (x.slug === slug ? { ...x, z: top + 1, min: false } : x)));
    setTimeout(() => document.getElementById(`win-${slug}`)?.focus({ preventScroll: true }), 30);
  }, [top]);

  const open = (slug: string, el: HTMLElement) => {
    const rect = desk.current!.getBoundingClientRect();
    const ir = el.getBoundingClientRect();
    if (wins.some((w) => w.slug === slug)) return focusWin(slug);
    const n = wins.length;
    const w = Math.min(780, rect.width * 0.64), h = Math.min(560, rect.height * 0.86);
    const x = Math.max(8, Math.min(rect.width - w - 8, 36 + n * 34)), y = Math.max(8, Math.min(rect.height - h - 8, 18 + n * 28));
    setTop((t) => t + 1);
    setWins((ws) => [...ws, { slug, x, y, w, h, z: top + 1, min: false, dev: "desktop", ox: ir.left + ir.width / 2 - rect.left - x, oy: ir.top + ir.height / 2 - rect.top - y, ba: false }]);
    setActive(slug);
    setGo(slug);
    setTimeout(() => document.getElementById(`win-${slug}`)?.focus({ preventScroll: true }), 80);
  };
  const close = (slug: string) => { setWins((w) => w.filter((x) => x.slug !== slug)); setActive(null); };
  const patch = (slug: string, p: Partial<Win>) => setWins((w) => w.map((x) => (x.slug === slug ? { ...x, ...p } : x)));

  // Échap ferme la fenêtre active
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && active && !document.querySelector("[role=dialog][aria-modal=true]")) close(active); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [active]);

  const startDrag = (e: React.PointerEvent, w: Win, mode: "move" | "size") => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const rect = desk.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y, ow = w.w, oh = w.h;
    focusWin(w.slug);
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (mode === "move") patch(w.slug, { x: Math.max(-w.w + 80, Math.min(rect.width - 80, ox + dx)), y: Math.max(0, Math.min(rect.height - 40, oy + dy)) });
      else patch(w.slug, { w: Math.max(360, Math.min(rect.width - ox, ow + dx)), h: Math.max(300, Math.min(rect.height - oy, oh + dy)) });
    };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  };
  const keyMove = (e: React.KeyboardEvent, w: Win) => {
    const d = e.shiftKey ? 48 : 16;
    const m: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
    if (m[e.key]) { e.preventDefault(); patch(w.slug, { x: w.x + m[e.key][0], y: Math.max(0, w.y + m[e.key][1]) }); }
  };

  const minimized = wins.filter((w) => w.min);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="muted max-w-xl text-[0.92rem]">Ouvrez un projet comme une fenêtre de travail : déplacez-la, redimensionnez-la, réduisez-la dans le dock. Échap ferme la fenêtre active.</p>
        <button type="button" className="btn btn-outline !min-h-[44px] !px-5 text-sm" onClick={onListView}>Vue liste classique</button>
      </div>
      <div ref={desk} className="desk relative h-[78vh] min-h-[620px] overflow-hidden" data-tone="light">
        {/* icônes de projets, disposées en profondeur */}
        <ul className="relative z-[1] flex flex-wrap items-start gap-x-10 gap-y-6 p-8" aria-label="Projets">
          {projects.map((p, i) => (
            <li key={p.slug} style={{ transform: `translateY(${(i % 3) * 22}px) rotate(${i % 2 ? -1.4 : 1.2}deg) scale(${1 - (i % 3) * 0.04})` }}>
              <a href={`/realisations/${p.slug}`} className="desk-icon group block w-[200px]" data-cursor="Ouvrir" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(p.slug, e.currentTarget); }}>
                <span className="chamfer-sm relative block aspect-[8/5] overflow-hidden border hair bg-ivory-200 shadow-[0_18px_30px_-18px_rgba(28,28,28,.45)] transition-transform duration-500 group-hover:-translate-y-1.5">
                  {p.cover && <Image src={p.cover} alt="" fill sizes="200px" className="object-cover" />}
                  {p.isExample && <span className="absolute left-2 top-2 bg-ink-900/90 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-ivory">Projet concept</span>}
                </span>
                <span className="mt-3 block text-[0.92rem] font-semibold">{p.title}</span>
                <span className="muted block text-[0.78rem] uppercase tracking-wider">{p.sector}</span>
              </a>
            </li>
          ))}
        </ul>

        <AnimatePresence>
          {wins.map((w) => {
            const p = by(w.slug);
            const deskImgs = p.planes.filter((x) => !["mobile", "tablet"].includes(x.kind)).map((x) => x.image);
            const tab = p.planes.find((x) => x.kind === "tablet")?.image;
            const mob = p.planes.find((x) => x.kind === "mobile")?.image;
            const lh = p.meta.lighthouse;
            return (
              <motion.div
                key={w.slug}
                id={`win-${w.slug}`}
                role="dialog"
                aria-label={`Fenêtre : ${p.title}`}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.25 }}
                animate={{ opacity: w.min ? 0 : 1, scale: w.min ? 0.2 : 1, y: w.min ? 80 : 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z, transformOrigin: `${w.ox}px ${w.oy}px`, pointerEvents: w.min ? "none" : "auto" }}
                className="desk-win chamfer absolute flex flex-col border hair bg-ivory outline-none"
                onPointerDown={() => active !== w.slug && focusWin(w.slug)}
              >
                <div className="flex cursor-grab touch-none items-center gap-3 border-b hair bg-ink-900 px-3 py-2 text-ivory active:cursor-grabbing" tabIndex={0} aria-label={`Barre de titre de ${p.title}. Flèches pour déplacer.`} onKeyDown={(e) => keyMove(e, w)} onPointerDown={(e) => startDrag(e, w, "move")}>
                  <span className="flex gap-1.5" aria-hidden="true"><i className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--accent-hi))]" /><i className="h-2.5 w-2.5 rounded-full bg-ivory/40" /><i className="h-2.5 w-2.5 rounded-full bg-ivory/40" /></span>
                  <span className="flex-1 truncate text-center text-[0.82rem] font-medium">{p.title}</span>
                  <button type="button" className="px-2 text-[0.8rem] hover:text-[rgb(var(--accent-hi))]" onClick={() => patch(w.slug, { min: true })} aria-label={`Réduire ${p.title} dans le dock`}>—</button>
                  <button type="button" className="px-2 text-[0.8rem] hover:text-[rgb(var(--accent-hi))]" onClick={() => close(w.slug)} aria-label={`Fermer ${p.title}`}>✕</button>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-b hair px-3 py-2 text-[0.78rem]" role="group" aria-label="Appareil">
                  {(["desktop", "tablet", "mobile"] as Dev[]).filter((d) => d === "desktop" ? deskImgs.length : d === "tablet" ? tab : mob).map((d) => (
                    <button key={d} type="button" aria-pressed={w.dev === d && !w.ba} onClick={() => patch(w.slug, { dev: d, ba: false })} className={`px-3 py-1.5 font-medium transition-colors ${w.dev === d && !w.ba ? "bg-ink-900 text-ivory" : "hover:bg-ink-900/10"}`}>{d === "desktop" ? "Ordinateur" : d === "tablet" ? "Tablette" : "Mobile"}</button>
                  ))}
                  {p.beforeImage && p.cover && <button type="button" aria-pressed={w.ba} onClick={() => patch(w.slug, { ba: !w.ba })} className={`px-3 py-1.5 font-medium ${w.ba ? "bg-ink-900 text-ivory" : "hover:bg-ink-900/10"}`}>Avant / Après</button>}
                  <span className="flex-1" />
                  {p.planes.length > 1 && <button type="button" className="btn btn-primary !min-h-[34px] !px-4 !py-1.5 text-[0.78rem]" onClick={() => viewer.open(p.slug)}>Vue éclatée</button>}
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-u px-2 font-medium">Visiter ↗</a>}
                </div>
                <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_210px]">
                  <div className="flex min-h-0 items-start justify-center overflow-hidden bg-ivory-200 p-3">
                    <div className="h-full overflow-hidden border hair bg-white shadow-[0_14px_30px_-20px_rgba(28,28,28,.5)] transition-[width] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: w.ba ? "100%" : w.dev === "desktop" ? "100%" : w.dev === "tablet" ? "64%" : "34%" }}>
                      {w.ba && p.beforeImage ? <BeforeAfter before={p.beforeImage} after={p.cover} title={p.title} />
                        : w.dev === "desktop" && deskImgs.length ? <AutoScroll images={deskImgs} alt={`Capture du site ${p.title}`} />
                        : (w.dev === "tablet" ? tab : mob) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={(w.dev === "tablet" ? tab : mob)!} alt={`${p.title}, version ${w.dev === "tablet" ? "tablette" : "mobile"}`} className="h-full w-full object-cover object-top" />
                        : null}
                    </div>
                  </div>
                  <aside className="hidden overflow-y-auto border-l hair p-4 md:block" data-lenis-prevent>
                    <p className="eyebrow solo mb-2 !text-[0.66rem]">{p.sector}{p.year ? ` · ${p.year}` : ""}</p>
                    <p className="text-[0.88rem] leading-snug">{p.summary}</p>
                    {lh ? (
                      <div className="mt-5">
                        <p className="label">Lighthouse mesuré</p>
                        <div className="grid grid-cols-2 gap-x-2">
                          <Gauge label="Perf." v={lh.performance} go={go === w.slug} /><Gauge label="Access." v={lh.accessibility} go={go === w.slug} />
                          <Gauge label="Bonnes pr." v={lh.bestPractices} go={go === w.slug} /><Gauge label="SEO" v={lh.seo} go={go === w.slug} />
                        </div>
                        {p.meta.capturedAt && <p className="muted text-[0.7rem]">{lh.source} · {new Date(p.meta.capturedAt).toLocaleDateString("fr-FR")}</p>}
                      </div>
                    ) : <p className="muted mt-5 text-[0.78rem]">Scores Lighthouse : non mesurés pour ce projet.</p>}
                    {p.duration && (
                      <div className="mt-5">
                        <p className="label">Du brief à la mise en ligne : {p.duration}</p>
                        <ol className="relative border-l hair pl-4">{STEPS.map((s, i) => (<li key={s} className="desk-step relative pb-3 text-[0.78rem]" style={{ animationDelay: `${i * 90}ms` }}><span className="absolute -left-[21px] top-1.5 h-2 w-2 bg-[rgb(var(--accent))]" />{s}</li>))}</ol>
                      </div>
                    )}
                  </aside>
                </div>
                <span className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize touch-none" onPointerDown={(e) => startDrag(e, w, "size")} aria-hidden="true"><i className="absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-[rgb(var(--accent))]" /></span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* dock des fenêtres réduites */}
        {minimized.length > 0 && (
          <div className="absolute inset-x-0 bottom-3 z-[999] flex justify-center gap-3" role="toolbar" aria-label="Fenêtres réduites">
            {minimized.map((w) => (
              <button key={w.slug} type="button" onClick={() => focusWin(w.slug)} className="chamfer-sm flex items-center gap-2 border hair bg-ivory px-2 py-1.5 shadow-lg" aria-label={`Rouvrir ${by(w.slug).title}`}>
                {by(w.slug).cover && <Image src={by(w.slug).cover} alt="" width={56} height={35} className="h-[35px] w-[56px] object-cover" />}
                <span className="pr-2 text-[0.78rem] font-medium">{by(w.slug).title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

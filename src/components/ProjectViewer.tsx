"use client";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { detect3D } from "./scene/capability";
import type { SceneApi, VPlane } from "./scene/ExplodeScene";

const ExplodeScene = dynamic(() => import("./scene/ExplodeScene"), { ssr: false });

export type VProject = {
  slug: string; title: string; client: string; sector: string; year: number; isExample: boolean; url: string; summary: string;
  planes: (VPlane & { depth: number })[];
  meta: { capturedAt?: string; title?: string; description?: string; h1?: string[]; headings?: Record<string, number>; technologies?: string[]; lighthouse?: { performance: number; accessibility: number; bestPractices: number; seo: number; source: string } | null };
};

const Ctx = createContext<{ open: (slug: string) => boolean; has: (slug: string) => boolean }>({ open: () => false, has: () => false });
export const useViewer = () => useContext(Ctx);

export function ViewerProvider({ projects, children }: { projects: VProject[]; children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const withPlanes = useMemo(() => projects.filter((p) => p.planes.length > 0), [projects]);
  const has = useCallback((s: string) => withPlanes.some((p) => p.slug === s), [withPlanes]);
  const open = useCallback((s: string) => {
    if (!withPlanes.some((p) => p.slug === s)) return false;
    opener.current = document.activeElement as HTMLElement | null;
    setSlug(s);
    return true;
  }, [withPlanes]);
  const close = useCallback(() => { setSlug(null); setTimeout(() => opener.current?.focus?.(), 0); }, []);
  const cur = withPlanes.find((p) => p.slug === slug) ?? null;
  const step = useCallback((d: number) => {
    if (!cur) return;
    const i = withPlanes.findIndex((p) => p.slug === cur.slug);
    setSlug(withPlanes[(i + d + withPlanes.length) % withPlanes.length].slug);
  }, [cur, withPlanes]);
  return (
    <Ctx.Provider value={{ open, has }}>
      {children}
      {cur && <Viewer key={cur.slug} p={cur} onClose={close} onNext={withPlanes.length > 1 ? () => step(1) : undefined} />}
    </Ctx.Provider>
  );
}

const frame = "pointer-events-none absolute h-10 w-10 border-[var(--fr)]";

function Viewer({ p, onClose, onNext }: { p: VProject; onClose: () => void; onNext?: () => void }) {
  const [mode, setMode] = useState<"3d" | "classic">("classic");
  const [selected, setSelected] = useState<string | null>(null);
  const [slider, setSlider] = useState(0.55);
  const explode = useRef(0.55);
  const api = useRef<SceneApi | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [low, setLow] = useState(false);
  const desk3d = p.planes.filter((x) => x.kind !== "tablet");

  useEffect(() => {
    const ok = detect3D() && desk3d.length >= 2;
    setMode(ok ? "3d" : "classic");
    setLow(window.innerWidth < 900);
    document.documentElement.classList.add("lenis-stopped");
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => { document.documentElement.classList.remove("lenis-stopped"); document.body.style.overflow = ""; };
  }, [desk3d.length]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "Tab" && root.current) {
        const f = Array.from(root.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,[tabindex="0"]')).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  const sel = p.planes.find((x) => x.id === selected) ?? null;
  const move = (d: number) => {
    const list = desk3d;
    const i = list.findIndex((x) => x.id === selected);
    setSelected(list[(i + d + list.length) % list.length]?.id ?? list[0].id);
  };
  const lh = p.meta.lighthouse;
  const hn = p.meta.headings;

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={`Vue éclatée : ${p.title}`} className="fixed inset-0 z-[80] flex items-stretch justify-center bg-ink-900/70 p-0 backdrop-blur-sm md:p-6" style={{ ["--fr" as string]: "rgb(var(--accent-hi))" }}>
      <div className="light-section chamfer relative flex h-full w-full max-w-[1500px] flex-col overflow-hidden md:flex-row">
        <span className={`${frame} left-3 top-3 border-l-2 border-t-2`} aria-hidden="true" />
        <span className={`${frame} bottom-3 right-3 border-b-2 border-r-2`} aria-hidden="true" />

        <div className="relative min-h-[50svh] flex-1 bg-ivory-200 md:min-h-0">
          <button type="button" onClick={onClose} className="btn btn-primary absolute right-4 top-4 z-10 !min-h-[44px] !px-4 text-sm md:hidden" aria-label="Fermer la vue éclatée">Fermer</button>
          {mode === "3d" ? (
            <>
              <div className="absolute inset-0 touch-none" aria-hidden="true">
                <ExplodeScene planes={desk3d} explode={explode} selected={selected} onSelect={setSelected} apiRef={api} running lowPower={low} />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-6 gap-y-3 bg-gradient-to-t from-ivory-200 via-ivory-200/90 to-transparent px-6 pb-5 pt-10">
                <label className="flex min-w-[160px] flex-1 items-center gap-3 text-[0.82rem] font-medium uppercase tracking-[0.12em]">
                  <span className="hidden sm:inline">Assembler</span>
                  <input type="range" min={0} max={1} step={0.01} value={slider} onChange={(e) => { const v = Number(e.target.value); setSlider(v); explode.current = v; }} aria-label="Assembler ou éclater la vue" className="h-11 flex-1 accent-[rgb(122,10,34)]" />
                  <span className="hidden sm:inline">Éclater</span>
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Contrôles de la vue">
                  <button type="button" className="btn btn-ghost !min-h-[44px] !w-11 !px-0" aria-label="Zoom avant" onClick={() => api.current?.zoom(0.82)}>+</button>
                  <button type="button" className="btn btn-ghost !min-h-[44px] !w-11 !px-0" aria-label="Zoom arrière" onClick={() => api.current?.zoom(1.22)}>−</button>
                  <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 text-sm" onClick={() => api.current?.reset()}>Recentrer</button>
                  <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 text-sm" onClick={() => move(-1)} aria-label="Plan précédent">←</button>
                  <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 text-sm" onClick={() => move(1)} aria-label="Plan suivant">→</button>
                </div>
              </div>
              <p className="pointer-events-none absolute left-6 top-6 hidden text-[0.78rem] uppercase tracking-[0.16em] muted md:block">Glissez pour tourner · molette pour zoomer · cliquez un plan</p>
            </>
          ) : (
            <ol className="absolute inset-0 space-y-8 overflow-y-auto p-6 md:p-10" data-lenis-prevent>
              {p.planes.map((pl, i) => (
                <li key={pl.id}>
                  <figure>
                    <div className="relative overflow-hidden border hair bg-white">
                      <Image src={pl.image} alt={`${pl.name} — ${p.title}`} width={1440} height={pl.kind === "mobile" ? 3000 : 900} sizes="(min-width:768px) 60vw, 100vw" className={pl.kind === "mobile" ? "mx-auto h-auto max-h-[70svh] w-auto" : "h-auto w-full"} priority={i < 2} />
                    </div>
                    <figcaption className="mt-3 text-[0.92rem]"><span className="font-medium">{pl.name}</span>{pl.caption ? <span className="muted"> — {pl.caption}</span> : null}</figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="flex max-h-[44svh] w-full shrink-0 flex-col overflow-y-auto border-t hair p-6 md:max-h-none md:w-[380px] md:border-l md:border-t-0 md:p-8" data-lenis-prevent>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">{p.sector}{p.year ? ` · ${p.year}` : ""}</p>
              <h2 className="text-h3 font-medium">{p.title}</h2>
              {p.isExample && <p className="mt-3 inline-block border hair px-3 py-1 text-[0.72rem] uppercase tracking-[0.14em]">Projet concept</p>}
            </div>
            <button ref={closeBtn} type="button" onClick={onClose} className="btn btn-ghost hidden !min-h-[44px] !px-4 text-sm md:inline-flex">Fermer</button>
          </div>
          <p className="muted text-[0.95rem] leading-relaxed">{p.summary}</p>

          <div className="mt-6 border-t hair pt-5" aria-live="polite">
            {sel ? (<><p className="label">Plan sélectionné</p><p className="font-medium">{sel.name}</p><p className="muted mt-1 text-[0.92rem]">{sel.caption || "Pas de légende pour ce plan."}</p></>) : (<p className="muted text-[0.9rem]">{mode === "3d" ? "Cliquez sur un plan (ou utilisez les flèches) pour lire son rôle et les choix de conception." : "Les mêmes plans, en lecture simple."}</p>)}
          </div>

          {(p.meta.title || p.meta.h1?.length || hn) && (
            <section className="mt-6 border-t hair pt-5">
              <h3 className="label">Référencement</h3>
              <dl className="space-y-2 text-[0.88rem]">
                {p.meta.title && <div><dt className="muted">Titre</dt><dd>{p.meta.title}</dd></div>}
                {p.meta.description && <div><dt className="muted">Description</dt><dd>{p.meta.description}</dd></div>}
                {p.meta.h1?.[0] && <div><dt className="muted">H1</dt><dd>{p.meta.h1[0]}</dd></div>}
                {hn && <div><dt className="muted">Structure</dt><dd>{Object.entries(hn).filter(([, n]) => n > 0).map(([k, n]) => `${k.toUpperCase()} ×${n}`).join(" · ")}</dd></div>}
              </dl>
            </section>
          )}
          {lh && (
            <section className="mt-6 border-t hair pt-5">
              <h3 className="label">Performance mesurée</h3>
              <dl className="grid grid-cols-4 gap-2 text-center">
                {([["Perf.", lh.performance], ["Access.", lh.accessibility], ["Bonnes pr.", lh.bestPractices], ["SEO", lh.seo]] as const).map(([k, v]) => (<div key={k} className="border hair p-2"><dd className="text-xl font-medium">{v}</dd><dt className="muted text-[0.68rem] uppercase tracking-wider">{k}</dt></div>))}
              </dl>
              <p className="muted mt-2 text-[0.75rem]">{lh.source}{p.meta.capturedAt ? ` · ${new Date(p.meta.capturedAt).toLocaleDateString("fr-FR")}` : ""}</p>
            </section>
          )}
          {p.meta.technologies && p.meta.technologies.length > 0 && (
            <section className="mt-6 border-t hair pt-5">
              <h3 className="label">Technologies détectées</h3>
              <ul className="flex flex-wrap gap-2">{p.meta.technologies.map((t) => (<li key={t} className="border hair px-2.5 py-1 text-[0.82rem]">{t}</li>))}</ul>
            </section>
          )}

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary !min-h-[44px] !px-5 text-sm">Visiter le site ↗</a>}
            {onNext && <button type="button" onClick={onNext} className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Projet suivant</button>}
            <button type="button" onClick={() => setMode(mode === "3d" ? "classic" : "3d")} className="btn btn-ghost !min-h-[44px] !px-5 text-sm" aria-pressed={mode === "classic"}>{mode === "3d" ? "Vue classique" : detect3D() ? "Vue 3D" : "Vue classique (3D indisponible)"}</button>
            <Link href={`/realisations/${p.slug}`} className="link-u acc self-center text-sm" onClick={onClose}>Fiche complète →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

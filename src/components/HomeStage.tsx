"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stage } from "./scene/store";
import { detect3D } from "./scene/capability";

const StageCanvas = dynamic(() => import("./scene/StageCanvas"), { ssr: false });

type Props = {
  hero: { kicker: string; line1: string; line2: string; line3: string; lead: string; ctaPrimary: string; ctaSecondary: string };
  layers: { title: string; text: string }[];
  covers: string[];
  accent: string; // rgb() utilisé pour dessiner les textures
};

export function HomeStage({ hero, layers, covers, accent }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const heroEl = useRef<HTMLElement>(null);
  const expEl = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  const [active, setActive] = useState(-1);
  const [prog, setProg] = useState(0);
  const lowPower = useRef(false);
  const pinned = mode === "3d";

  // détection + chargement différé : le H1 (LCP) est déjà rendu côté serveur
  useEffect(() => {
    stage.covers = covers;
    if (!detect3D()) return setMode("static");
    lowPower.current = window.innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4;
    const go = () => setMode("3d");
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const hasIdle = typeof w.requestIdleCallback === "function";
    const id = hasIdle ? w.requestIdleCallback!(go, { timeout: 1500 }) : window.setTimeout(go, 400);
    return () => (hasIdle ? w.cancelIdleCallback?.(id) : window.clearTimeout(id));
  }, [covers]);

  // pointeur global (la scène ne capte pas les événements)
  useEffect(() => {
    if (mode !== "3d" || !window.matchMedia("(hover: hover)").matches) return;
    const m = (e: PointerEvent) => { stage.mx = (e.clientX / innerWidth) * 2 - 1; stage.my = (e.clientY / innerHeight) * 2 - 1; };
    window.addEventListener("pointermove", m, { passive: true });
    return () => window.removeEventListener("pointermove", m);
  }, [mode]);

  // pause du rendu hors écran / onglet masqué
  useEffect(() => {
    if (mode !== "3d" || !wrap.current) return;
    let vis = true;
    const upd = () => setRunning(vis && !document.hidden);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; upd(); }, { rootMargin: "100px" });
    io.observe(wrap.current);
    document.addEventListener("visibilitychange", upd);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", upd); };
  }, [mode]);

  // scroll narratif : sortie du hero + section épinglée (vue éclatée)
  useEffect(() => {
    if (mode !== "3d" || !heroEl.current || !expEl.current) return;
    gsap.registerPlugin(ScrollTrigger);
    let last = -2;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: heroEl.current, start: "top top", end: "bottom top", scrub: true, onUpdate: (s) => { stage.heroOut = s.progress; } });
      ScrollTrigger.create({
        trigger: expEl.current, start: "top top", end: "+=420%", pin: true, scrub: true, anticipatePin: 1,
        onUpdate: (s) => {
          stage.progress = s.progress;
          const p = s.progress;
          const a = p < 0.2 || p > 0.88 ? -1 : Math.min(layers.length - 1, Math.floor(((p - 0.2) / 0.68) * layers.length));
          stage.active = a;
          if (a !== last) { last = a; setActive(a); }
          setProg(p);
        },
      });
    }, wrap);
    return () => { ctx.revert(); stage.heroOut = 0; stage.progress = 0; stage.active = -1; };
  }, [mode, layers.length]);

  const intro = active === -1 && prog < 0.5;

  return (
    <div ref={wrap} className="dark-section relative overflow-clip">
      {/* Couche 3D (sticky derrière le texte de premier plan, devant le texte d'arrière-plan) */}
      <div className="pointer-events-none sticky top-0 z-[1] -mb-[100svh] h-[100svh] w-full" style={{ opacity: pinned ? 1 - Math.min(1, Math.max(0, (prog - 0.93) / 0.07)) : 1 }} aria-hidden="true">
        {/* repli statique : affiché pendant le chargement, sans WebGL, ou sur appareil faible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-fallback.webp" alt="" width={1600} height={1000} fetchPriority="high" className={`absolute inset-y-0 right-[-8%] my-auto h-auto w-[78%] max-w-[1100px] object-contain transition-opacity duration-700 max-md:inset-x-0 max-md:bottom-[-4%] max-md:top-auto max-md:right-auto max-md:mx-auto max-md:my-0 max-md:w-[135%] ${ready ? "opacity-0" : "opacity-100"}`} />
        {mode === "3d" && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <StageCanvas layers={layers} accent={accent} lowPower={lowPower.current} running={running} onReady={() => setReady(true)} />
          </div>
        )}
      </div>

      {/* HERO */}
      <section ref={heroEl} className="relative flex min-h-[100svh] flex-col justify-end pb-14 pt-32 md:justify-center md:pb-20" aria-labelledby="h1">
        <div className="container">
          <p className="eyebrow relative z-[2] mb-6 md:mb-8">{hero.kicker}</p>
          <h1 id="h1" className="text-display font-medium">
            <span className="relative z-0 block">
              <span className="ln hero-ln"><span style={{ ["--d" as string]: "0.05s" }}>{hero.line1}</span></span>
              <span className="ln hero-ln"><span style={{ ["--d" as string]: "0.15s" }}>{hero.line2}</span></span>
            </span>
            <span className="relative z-[2] block">
              <span className="ln hero-ln"><span className="serif-it" style={{ ["--d" as string]: "0.25s" }}>{hero.line3}</span></span>
            </span>
          </h1>
          <div className="relative z-[2] mt-8 max-w-[34rem] md:mt-10">
            <p className="muted text-[1.1rem] leading-relaxed md:text-[1.2rem]">{hero.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">{hero.ctaPrimary} <span aria-hidden="true">→</span></Link>
              <Link href="/realisations" className="btn btn-ghost">{hero.ctaSecondary}</Link>
            </div>
          </div>
        </div>
        <div className="muted absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] md:flex">
          <span className="relative block h-9 w-px overflow-hidden bg-current/20"><span className="absolute inset-x-0 top-0 h-3 acc-bg" style={{ animation: "scrolldrop 2s ease-in-out infinite" }} /></span>
          Défiler
        </div>
      </section>

      {/* VUE ÉCLATÉE */}
      <section ref={expEl} className={`relative ${pinned ? "h-[100svh]" : "py-24"}`} aria-labelledby="layers-title">
        <div className={`container ${pinned ? "flex h-full items-end pb-12 md:items-center md:pb-0" : ""}`}>
          {pinned ? (
            <div className="relative z-[2] w-full max-w-[26rem]">
              <p className="eyebrow mb-5">Sous le capot · {String(Math.max(active, 0) + 1).padStart(2, "0")} / {String(layers.length).padStart(2, "0")}</p>
              <div key={active} className="swap min-h-[11rem] md:min-h-[13rem]">
                {active === -1 ? (
                  <>
                    <h2 id="layers-title" className="text-h2 font-medium">{intro ? <>Un site, <span className="serif-it">cinq couches.</span></> : <>Tout <span className="serif-it">s&apos;assemble.</span></>}</h2>
                    <p className="muted mt-4 leading-relaxed">{intro ? "Faites défiler : nous ouvrons un site pour vous montrer ce qui le rend efficace." : "Design, contenu, code, référencement et performance travaillent ensemble. C'est ce qui fait la différence."}</p>
                  </>
                ) : (
                  <>
                    <h2 id="layers-title" className="serif-it text-h2">{layers[active].title}</h2>
                    <p className="mt-4 text-[1.1rem] leading-relaxed">{layers[active].text}</p>
                  </>
                )}
              </div>
              <div className="mt-6 flex items-center gap-4" role="progressbar" aria-label="Avancement de la vue éclatée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(prog * 100)}>
                <div className="h-px flex-1 bg-white/15"><div className="h-px acc-bg" style={{ width: `${prog * 100}%` }} /></div>
                <span className="muted text-[0.8rem] tabular-nums">{Math.round(prog * 100)} %</span>
              </div>
            </div>
          ) : (
            <div>
              <h2 id="layers-title" className="text-h2 font-medium">Un site, <span className="serif-it">cinq couches.</span></h2>
              <ol className="mt-12 grid gap-px md:grid-cols-5">
                {layers.map((l, i) => (
                  <li key={l.title} className="border hair p-6">
                    <p className="muted text-[0.8rem]">0{i + 1}</p>
                    <h3 className="serif-it mt-6 text-3xl">{l.title}</h3>
                    <p className="muted mt-3 text-[0.95rem] leading-relaxed">{l.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { preload } from "react-dom";
import { stage } from "./scene/store";
import { detect3D } from "./scene/capability";
import { WordReveal } from "./Motion";

const StageCanvas = dynamic(() => import("./scene/StageCanvas"), { ssr: false });

type Props = {
  hero: { kicker: string; line1: string; line2: string; line3: string; lead: string; ctaPrimary: string; ctaSecondary: string };
  layers: { title: string; text: string }[];
  covers: string[];
  accent: string; // rgb() utilisé pour dessiner les textures
  bg?: { src: string; dim: number }; // fond du hero (image ou vidéo) choisi dans l'admin
};

const isVideoBg = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Bouton « magnétique » : suit légèrement le pointeur au survol (ordinateur uniquement). */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transform = `translate(${Math.max(-8, Math.min(8, x))}px, ${Math.max(-6, Math.min(6, y))}px)`;
    };
    const leave = () => { el.style.transform = ""; };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  return <span ref={ref} className="magnetic">{children}</span>;
}

export function HomeStage({ hero, layers, covers, accent, bg }: Props) {
  preload("/models/macbook.fbx", { as: "fetch", crossOrigin: "anonymous" }); // le modèle se télécharge dès l'arrivée, pendant le titre
  const wrap = useRef<HTMLDivElement>(null);
  const heroEl = useRef<HTMLElement>(null);
  const heroInner = useRef<HTMLDivElement>(null);
  const expEl = useRef<HTMLElement>(null);
  const layerEl = useRef<HTMLDivElement>(null);
  const heroEnd = useRef(0); // position de défilement où le hero se libère
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [load3d, setLoad3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [running, setRunning] = useState(true);
  const [active, setActive] = useState(-1);
  const [prog, setProg] = useState(0);
  const lowPower = useRef(false);
  const pinned = mode === "3d";

  // décalage continu de 0,08 s entre les mots, d'une ligne à l'autre
  const n1 = words(hero.line1), n2 = words(hero.line2), n3 = words(hero.line3);
  const STEP = 0.05;
  const d1 = 0.05, d2 = d1 + n1 * STEP, d3 = d2 + n2 * STEP, titleEnd = d3 + n3 * STEP;

  // détection ; le modèle 3D n'est chargé qu'une fois le titre affiché
  useEffect(() => {
    stage.covers = covers;
    if (!detect3D()) return setMode("static");
    lowPower.current = window.innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4;
    stage.auto = !matchMedia("(hover: hover)").matches;
    setMode("3d");
    const t = setTimeout(() => setLoad3d(true), 0); // la scène démarre aussitôt (le titre est déjà affiché côté serveur)
    return () => clearTimeout(t);
  }, [covers, titleEnd]);

  // sécurité : si la scène 3D n'est pas prête après 7 s, on affiche l'image fixe
  useEffect(() => { if (mode !== "3d" || ready) return; const t = setTimeout(() => setSlow(true), 7000); return () => clearTimeout(t); }, [mode, ready]);

  // pointeur : inclinaison du portable + halo doux qui suit la souris (ordinateur uniquement)
  useEffect(() => {
    if (mode === "pending" || !matchMedia("(hover: hover)").matches) return;
    const m = (e: PointerEvent) => {
      stage.mx = (e.clientX / innerWidth) * 2 - 1; stage.my = (e.clientY / innerHeight) * 2 - 1;
      const h = heroEl.current;
      if (h) { h.style.setProperty("--gx", `${e.clientX}px`); h.style.setProperty("--gy", `${e.clientY}px`); }
    };
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

  // défilement : sortie du hero, puis « Sous le capot » (épinglée)
  useEffect(() => {
    if (mode !== "3d" || !heroEl.current || !expEl.current) return;
    gsap.registerPlugin(ScrollTrigger);
    let last = -2;
    let fHero = 1, fEnd = 1;
    const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const paint = () => { if (layerEl.current) layerEl.current.style.opacity = String(fHero * fEnd); };
    const ctx = gsap.context(() => {
      // sortie du hero (le zoom se défait, le portable rejoint la vue éclatée)
      ScrollTrigger.create({ trigger: expEl.current, start: "top bottom", end: "top top", scrub: true, onUpdate: (s) => { stage.heroOut = s.progress; fHero = innerWidth < 900 ? 1 - sm(0.04, 0.38, s.progress) + sm(0.8, 1, s.progress) : 1; paint(); } });
      ScrollTrigger.create({
        trigger: expEl.current, start: "top top", end: "+=500%", pin: true, scrub: true, anticipatePin: 1,
        onUpdate: (s) => {
          stage.progress = s.progress;
          const p = s.progress;
          fEnd = 1 - sm(0.8, 0.99, p); paint(); // fin : fondu lent de toute la scène (≈ 1 écran de défilement)
          const a = p < 0.18 || p > 0.8 ? -1 : Math.min(layers.length - 1, Math.floor(((p - 0.18) / 0.62) * layers.length));
          stage.active = a;
          if (a !== last) { last = a; setActive(a); }
          setProg(p);
        },
      });
    }, wrap);
    return () => {
      ctx.revert();
      if (layerEl.current) layerEl.current.style.opacity = "1";
      if (heroInner.current) { heroInner.current.style.transform = ""; heroInner.current.style.opacity = ""; }
      stage.heroOut = 0; stage.progress = 0; stage.active = -1; stage.zoom = 0;
    };
  }, [mode, layers.length]);

  /** « Découvrir nos solutions » : passe directement le hero (sans subir le zoom). */
  const skip = (e: React.MouseEvent) => {
    // hero épinglé : fin de l'épinglage + un écran ; sinon : haut de la section suivante
    const y = heroEnd.current ? heroEnd.current + innerHeight : expEl.current ? expEl.current.getBoundingClientRect().top + scrollY : 0;
    if (!y) return;
    e.preventDefault();
    const l = (window as unknown as { __lenis?: { scrollTo: (n: number, o: object) => void } }).__lenis;
    if (l) l.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const intro = active === -1 && prog < 0.5;

  return (
    <div ref={wrap} className="dark-section relative overflow-clip">
      {/* Couche 3D (sticky derrière le texte de premier plan, devant le texte d'arrière-plan) */}
      <div ref={layerEl} className="pointer-events-none sticky top-0 z-[1] -mb-[100svh] h-[100svh] w-full" aria-hidden="true">
        {/* repli statique : sans WebGL, appareil faible ou chargement trop long */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-fallback.webp" alt="" width={1600} height={1000} className={`absolute inset-y-0 right-0 my-auto h-auto w-[55%] max-w-[800px] translate-y-[9%] object-contain transition-opacity duration-700 max-md:inset-x-0 max-md:bottom-[-4%] max-md:top-auto max-md:right-auto max-md:mx-auto max-md:my-0 max-md:w-[135%] ${mode === "static" || (slow && !ready) ? "opacity-100" : "opacity-0"}`} />
        {mode === "3d" && load3d && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
            <StageCanvas layers={layers} accent={accent} lowPower={lowPower.current} running={running} onReady={() => setReady(true)} />
          </div>
        )}
      </div>

      {/* HERO */}
      <section data-nostyle ref={heroEl} className="hero-sec relative flex min-h-[100svh] flex-col justify-end pb-14 pt-28 md:justify-start md:pb-20 md:pt-[clamp(7.5rem,17vh,10.5rem)]" aria-labelledby="h1">
        {bg?.src ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {isVideoBg(bg.src) ? <video src={bg.src} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg.src} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "var(--s-bg, #1C1C1C)", opacity: bg.dim / 100 }} />
          </div>
        ) : null}
        <div ref={heroInner} className="container will-change-transform">
          <p className="eyebrow hero-kicker relative z-[2] mb-6 md:mb-7"><i className="hero-rule" aria-hidden="true" />{hero.kicker}</p>
          <h1 id="h1" className="text-hero font-medium">
            <span className="relative z-0 block">
              <span className="ln hero-ln"><span><WordReveal text={hero.line1} auto delay={d1} step={50} /></span></span>
              <span className="ln hero-ln"><span><WordReveal text={hero.line2} auto delay={d2} step={50} /></span></span>
            </span>
            <span className="relative z-[2] block">
              <span className="ln hero-ln hero-last"><span className="serif-it hero-mark"><WordReveal text={hero.line3} auto delay={d3} step={50} /><i className="hero-bar" aria-hidden="true" style={{ animationDelay: `${titleEnd}s` }} /></span></span>
            </span>
          </h1>
          <div className="hero-fade relative z-[2] mt-7 max-w-[34rem] md:mt-9" style={{ animationDelay: `${titleEnd + 0.15}s` }}>
            <p className="hero-lead text-[1.1rem] leading-relaxed md:text-[1.2rem]">{hero.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic><Link href="/contact" className="btn btn-primary btn-fill btn-arrow"><span>{hero.ctaPrimary}</span><span aria-hidden="true" className="arr">→</span></Link></Magnetic>
              <Magnetic><a href="#layers-title" onClick={skip} className="btn btn-ghost">{hero.ctaSecondary}</a></Magnetic>
            </div>
          </div>
        </div>
        <div className="muted absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] md:flex">
          <span className="block h-8 w-px bg-current/30" aria-hidden="true" />
          Défiler
        </div>
      </section>

      {/* VUE ÉCLATÉE (inchangée) */}
      <section data-nostyle ref={expEl} className={`relative ${pinned ? "h-[100svh]" : "py-24"}`} aria-labelledby="layers-title">
        <div className={`container ${pinned ? "flex h-full items-end pb-12 md:items-center md:pb-0" : ""}`}>
          {pinned ? (
            <div className="relative z-[2] w-full max-w-[26rem]">
              <p className="eyebrow mb-5">Sous le capot · {String(Math.max(active, 0) + 1).padStart(2, "0")} / {String(layers.length).padStart(2, "0")}</p>
              <div key={active} className="swap min-h-[11rem] md:min-h-[13rem]">
                {active === -1 ? (
                  <>
                    <h2 id="layers-title" className="text-h2 font-medium"><WordReveal key={intro ? "i1" : "i2"} text={intro ? "Un site, cinq couches." : "Tout s'assemble."} immediate step={70} /></h2>
                    <p className="muted mt-4 leading-relaxed"><WordReveal key={intro ? "p1" : "p2"} text={intro ? "Faites défiler : nous ouvrons un site pour vous montrer ce qui le rend efficace." : "Design, contenu, code, référencement et performance travaillent ensemble. C'est ce qui fait la différence."} immediate delay={0.2} step={24} /></p>
                  </>
                ) : (
                  <>
                    <h2 id="layers-title" className="serif-it text-[clamp(1.6rem,2.8vw,2.5rem)] leading-[1.05] [hyphens:none]"><WordReveal key={`t${active}`} text={layers[active].title} immediate step={60} /></h2>
                    <p className="mt-4 text-[1.05rem] leading-relaxed"><WordReveal key={`p${active}`} text={layers[active].text} immediate delay={0.25} step={22} /></p>
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

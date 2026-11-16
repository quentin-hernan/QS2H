"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ Préchargeur
   Rôle : masquer le montage de la scène à la toute première visite. Les cadres d'angle se dessinent autour du logo (1,2 s max). */
export function Preloader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    try { localStorage.setItem("qs2h-pl", "1"); } catch { /* navigation privée */ }
    const t = setTimeout(() => setGone(true), 1200);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader-box">
        <span className="pl-c pl-tl" /><span className="pl-c pl-br" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="" width={720} height={227} className="pl-logo" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Transition de page
   Rôle : donner un repère de changement de lieu. View Transitions API : un volet biseauté révèle la nouvelle page (masque). Repli : fondu. */
export function PageTransitions() {
  const router = useRouter();
  const path = usePathname();
  const cur = useRef(path);
  cur.current = path;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || /^\/(admin|api)/.test(u.pathname) || u.pathname === cur.current) return;
      if (reduced()) return; // navigation native, sans animation
      e.preventDefault();
      const go = () => new Promise<void>((resolve) => {
        router.push(u.pathname + u.search + u.hash);
        const t0 = performance.now();
        const poll = () => { if (location.pathname === u.pathname || performance.now() - t0 > 1800) requestAnimationFrame(() => requestAnimationFrame(() => resolve())); else setTimeout(poll, 30); };
        poll();
      });
      const d = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };
      if (d.startViewTransition) d.startViewTransition(go);
      else {
        const main = document.getElementById("contenu");
        main?.classList.add("route-out");
        go().then(() => { main?.classList.remove("route-out"); main?.classList.add("route-in"); setTimeout(() => main?.classList.remove("route-in"), 450); window.scrollTo(0, 0); });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
  useEffect(() => { if (!reduced()) window.scrollTo(0, 0); }, [path]);
  return null;
}

/* ------------------------------------------------------------------ Progression + indicateur de section
   Rôle : situer le lecteur dans la page. */
export function ScrollUI() {
  const bar = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const [secs, setSecs] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      const els = Array.from(document.querySelectorAll<HTMLElement>("main section[aria-labelledby], main section[aria-label]"));
      let a = 0;
      els.forEach((el, i) => { if (el.getBoundingClientRect().top < innerHeight * 0.45) a = i; });
      setActive(a);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const t = setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("main section[aria-labelledby], main section[aria-label]"));
      setSecs(els.length >= 3 && els.length <= 9 ? els.map((el, i) => ({ id: el.id || (el.id = `sec-${i}`), label: el.getAttribute("aria-label") || el.querySelector("h1,h2")?.textContent?.slice(0, 40) || `Section ${i + 1}` })) : []);
      tick();
    }, 600);
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { clearTimeout(t); removeEventListener("scroll", on); removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [path]);
  return (
    <>
      <div className="scroll-bar" aria-hidden="true"><div ref={bar} className="scroll-bar-fill" /></div>
      {secs.length > 0 && (
        <nav aria-label="Sections de la page" className="sec-dots">
          {secs.map((s, i) => (<a key={s.id} href={`#${s.id}`} aria-label={s.label} aria-current={i === active ? "true" : undefined} className="sec-dot"><span /></a>))}
        </nav>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Fond « atelier lumineux »
   Rôle : donner de la profondeur. Une seule source de lumière : la souris et le scroll déplacent les ombres de tous les plans de la même façon. */
export function LightDriver() {
  useEffect(() => {
    if (reduced() || !matchMedia("(hover: hover)").matches) return;
    const root = document.documentElement;
    let mx = 0, my = 0, cx = 0, cy = 0, raf = 0;
    const move = (e: PointerEvent) => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; };
    const loop = () => {
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      root.style.setProperty("--mx", cx.toFixed(3));
      root.style.setProperty("--my", cy.toFixed(3));
      root.style.setProperty("--sy", (scrollY / 1000).toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); };
    document.addEventListener("visibilitychange", vis);
    raf = requestAnimationFrame(loop);
    return () => { removeEventListener("pointermove", move); document.removeEventListener("visibilitychange", vis); cancelAnimationFrame(raf); };
  }, []);
  return null;
}

const PLANES: { x: string; y: string; w: string; h: string; d: number; m?: boolean }[] = [
  { x: "62%", y: "8%", w: "34%", h: "46%", d: 1 },
  { x: "-6%", y: "52%", w: "26%", h: "40%", d: 0.65 },
  { x: "78%", y: "58%", w: "18%", h: "30%", d: 0.35, m: true },
  { x: "30%", y: "-10%", w: "20%", h: "26%", d: 0.35, m: true },
];
export function AtelierBg({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className={`atelier atelier-${tone}`} aria-hidden="true">
      {PLANES.map((p, i) => (
        <div key={i} className={`atelier-plane ${p.m ? "max-md:hidden" : ""}`} style={{ left: p.x, top: p.y, width: p.w, height: p.h, ["--d" as string]: p.d }}>
          <span className="atelier-shadow" /><span className="atelier-face" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Cadre d'angle qui se dessine à l'entrée de section */
export function FrameDraw({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`frame-draw ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ Paragraphe d'introduction mot à mot au scroll (une section par page) */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) { el?.querySelectorAll("span").forEach((s) => ((s as HTMLElement).style.opacity = "1")); return; }
    gsap.registerPlugin(ScrollTrigger);
    const words = el.querySelectorAll("span");
    const tw = gsap.fromTo(words, { opacity: 0.18 }, { opacity: 1, ease: "none", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: true } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, []);
  return (
    <p ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (<span key={i} aria-hidden="true" style={{ display: "inline-block", marginRight: "0.28em" }}>{w}</span>))}
    </p>
  );
}

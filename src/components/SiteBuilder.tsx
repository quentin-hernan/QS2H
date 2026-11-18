"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Step = { title: string; text: string };

/**
 * Scène 3D liée au métier : une page web se construit bloc par bloc pendant le scroll
 * (maquette, contenu, code, référencement, performance, mise en ligne).
 * Le scroll pilote une seule variable CSS (--p, de 0 à 1) ; tout le reste est transform / opacity.
 */
export function SiteBuilder({ steps, title }: { steps: Step[]; title: string }) {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const n = Math.max(1, steps.length);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(list.current?.children ?? []) as HTMLElement[];
    const apply = (p: number) => {
      el.style.setProperty("--p", p.toFixed(4));
      const a = Math.min(n - 1, Math.floor(p * n * 0.999));
      items.forEach((li, i) => li.setAttribute("aria-current", i === a ? "step" : "false"));
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    apply(0);
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5, onUpdate: (s) => apply(s.progress) });
    return () => st.kill();
  }, [n]);

  return (
    <section ref={root} className="sb dark-section relative" aria-labelledby="sb-h" style={{ ["--p" as string]: 0, height: `${180 + n * 55}vh` }}>
      <div className="sb-stick">
        <div className="container grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-5">Votre site, étape par étape</p>
            <h2 id="sb-h" className="text-h2 font-medium">{title}</h2>
            <ol ref={list} className="sb-steps mt-8 space-y-1">
              {steps.map((s, i) => (
                <li key={i} aria-current="false" className="sb-step">
                  <span className="sb-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <strong className="block font-serif text-lg">{s.title}</strong>
                    <span className="sb-desc muted block max-w-sm text-[0.95rem]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-7" aria-hidden="true">
            <div className="sb-scene">
              <div className="sb-win">
                <div className="sb-bar"><i /><i /><i /><span>votre-site.fr</span></div>
                <div className="sb-page">
                  <div className="sb-b sb-nav" style={{ ["--s" as string]: 0 }}><b /><span /><span /><span /><em /></div>
                  <div className="sb-b sb-hero" style={{ ["--s" as string]: 0.8 }}>
                    <div className="sb-copy">
                      <span className="sb-line w70" /><span className="sb-line w50" />
                      <span className="sb-line thin w85" /><span className="sb-line thin w65" />
                      <span className="sb-btn" />
                    </div>
                    <div className="sb-photo" />
                  </div>
                  <div className="sb-b sb-cards" style={{ ["--s" as string]: 1.8 }}><i /><i /><i /></div>
                  <div className="sb-b sb-code" style={{ ["--s" as string]: 2.6 }}>
                    <span className="w40" /><span className="w70 ind" /><span className="w55 ind" /><span className="w30" />
                  </div>
                  <div className="sb-b sb-seo" style={{ ["--s" as string]: 3.4 }}><span className="dot" /><span className="w60" /><span className="w85 thin" /></div>
                </div>
                <div className="sb-live"><span /> En ligne</div>
              </div>
              <div className="sb-shadow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Step = { title: string; text: string; duration?: string };

/** Frise verticale : la ligne se dessine au scroll, chaque étape s'allume à son passage. */
export function Timeline({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLOListElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { line.current!.style.transform = "scaleY(1)"; root.current!.querySelectorAll("li").forEach((l) => l.classList.add("on")); return; }
    const ctx = gsap.context(() => {
      gsap.fromTo(line.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.4 } });
      root.current!.querySelectorAll("li").forEach((li) => ScrollTrigger.create({ trigger: li, start: "top 68%", onEnter: () => li.classList.add("on"), onLeaveBack: () => li.classList.remove("on") }));
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <ol ref={root} className="relative">
      <span aria-hidden="true" className="absolute bottom-2 left-[19px] top-2 w-px bg-current opacity-15" />
      <span ref={line} aria-hidden="true" className="acc-bg absolute bottom-2 left-[19px] top-2 w-px origin-top" style={{ transform: "scaleY(0)" }} />
      {steps.map((s, i) => (
        <li key={s.title} className="group tl-li relative grid grid-cols-[40px_1fr] gap-6 pb-14 last:pb-0 md:grid-cols-[40px_1fr_auto]">
          <span className="tl-num relative z-[1] mt-1 flex h-10 w-10 items-center justify-center rounded-full text-[0.8rem] font-semibold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <div className="opacity-35 transition-opacity duration-500 group-[.on]:opacity-100">
            <h3 className="text-h3 font-medium">{s.title}</h3>
            <p className="muted mt-2 max-w-[56ch] leading-relaxed">{s.text}</p>
          </div>
          {s.duration && <p className="muted col-start-2 text-[0.85rem] uppercase tracking-wider md:col-start-3 md:text-right">{s.duration}</p>}
        </li>
      ))}
    </ol>
  );
}

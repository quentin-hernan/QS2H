"use client";
import { useEffect, useRef, useState } from "react";

/** Compteur : anime la partie numérique d'une valeur (« 24 h », « 3 à 4 sem. », « 100 % »). */
export function CountUp({ value }: { value: string }) {
  const m = /^(\d+)(.*)$/.exec(value.trim());
  const end = m ? parseInt(m[1], 10) : 0;
  const rest = m ? m[2] : value;
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(m ? end : 0);

  useEffect(() => {
    if (!m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current!;
    setN(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        setN(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref} aria-label={value}>{m ? n : ""}{rest}</span>;
}

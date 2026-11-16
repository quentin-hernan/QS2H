"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Apparition au scroll (masque + translation). Respecte prefers-reduced-motion via le CSS. */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: { children: ReactNode; delay?: number; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ["--d" as string]: `${delay}s` }}>
      {children}
    </Tag>
  );
}

/** Titre révélé ligne par ligne (chaque ligne est masquée puis remonte). */
export function Lines({ lines, className = "", as: Tag = "h2", delay = 0, immediate = false }: { lines: ReactNode[]; className?: string; as?: ElementType; delay?: number; immediate?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (immediate) {
      const t = setTimeout(() => el.classList.add("in"), 120);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="ln" style={{ ["--d" as string]: `${delay + i * 0.1}s` }}>
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}

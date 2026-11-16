"use client";
import { useEffect, useRef } from "react";

/** Curseur léger : desktop avec souris uniquement, masqué sur les champs de texte. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ring.current;
    if (!fine || reduced || !el) return;
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement;
      const text = !!t.closest("input,textarea,select,[contenteditable],.ProseMirror");
      el.classList.toggle("hide", text);
      el.classList.toggle("big", !text && !!t.closest("a,button,[data-cursor],summary"));
    };
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      el.style.transform = `translate(${cx}px,${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    el.style.opacity = "1";
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ring} aria-hidden="true" className="cursor-ring" style={{ opacity: 0 }} />;
}

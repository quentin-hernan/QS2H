"use client";
import { useEffect, useRef } from "react";

/**
 * Curseur contextuel (ordinateur uniquement). Rôle : annoncer ce que le clic va faire.
 * Un attribut data-cursor="Voir" | "Glisser" | "Lire" | "Ouvrir" sur un élément change l'étiquette ; les boutons ont un léger effet magnétique.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const el = dot.current;
    if (!fine || matchMedia("(prefers-reduced-motion: reduce)").matches || !el) return;
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    let magnet: HTMLElement | null = null;
    let ox = 0, oy = 0; // décalage magnétique courant (le centre de référence exclut ce décalage : point fixe stable)
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as HTMLElement;
      const text = !!t.closest("input,textarea,select,[contenteditable],.ProseMirror");
      el.classList.toggle("hide", text);
      const ctx = t.closest<HTMLElement>("[data-cursor]");
      const word = ctx?.dataset.cursor && ctx.dataset.cursor !== "true" ? ctx.dataset.cursor : "";
      if (label.current && label.current.textContent !== word) label.current.textContent = word;
      el.classList.toggle("word", !!word && !text);
      el.classList.toggle("big", !word && !text && !!t.closest("a,button,summary,[role=button]"));
      const m = t.closest<HTMLElement>(".btn");
      if (m !== magnet) { if (magnet) magnet.style.transform = ""; magnet = m; ox = 0; oy = 0; }
    };
    const loop = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      el.style.transform = `translate(${cx}px,${cy}px)`;
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = (x - (r.left - ox + r.width / 2)) / r.width, dy = (y - (r.top - oy + r.height / 2)) / r.height;
        const tx = Math.max(-4, Math.min(4, dx * 6)), ty = Math.max(-3, Math.min(3, dy * 5));
        ox += (tx - ox) * 0.2; oy += (ty - oy) * 0.2;
        magnet.style.transform = Math.abs(ox) < 0.05 && Math.abs(oy) < 0.05 ? "" : `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    el.style.opacity = "1";
    addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); if (magnet) magnet.style.transform = ""; };
  }, []);
  return <div ref={dot} aria-hidden="true" className="cursor-dot" style={{ opacity: 0 }}><span ref={label} /></div>;
}

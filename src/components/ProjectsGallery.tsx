"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { detect3D } from "./scene/capability";
import { useViewer } from "./ProjectViewer";
import type { GItem } from "./scene/GalleryCanvas";

const GalleryCanvas = dynamic(() => import("./scene/GalleryCanvas"), { ssr: false });

type P = GItem & { summary: string; isExample: boolean };

/** Galerie 3D : écrans suspendus, drag / flèches / boutons. Repli en grille classique sans WebGL. */
export function ProjectsGallery({ items, accent, level = 3 }: { items: P[]; accent: string; level?: 2 | 3 }) {
  const viewer = useViewer();
  const withCover = items.filter((p) => !!p.cover); // une réalisation sans image ne doit jamais casser la scène
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [running, setRunning] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const api = useRef<{ jump: (d: number) => void } | null>(null);
  const ref = useCallback((el: HTMLElement | null) => setHost(el), []);

  useEffect(() => { setMode(detect3D() && withCover.length >= 2 ? "3d" : "static"); }, [withCover.length]);
  useEffect(() => {
    if (!host) return;
    let vis = false;
    const upd = () => setRunning(vis && !document.hidden);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; upd(); }, { rootMargin: "120px" });
    io.observe(host);
    document.addEventListener("visibilitychange", upd);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", upd); };
  }, [host]);

  if (mode === "static" || mode === "pending") {
    return (
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (<ProjectCard key={p.slug} p={p} priority={i < 3} level={level} />))}
      </div>
    );
  }
  return (
    <div>
      <section ref={ref} data-cursor="Glisser" tabIndex={0} aria-roledescription="carrousel" aria-label="Carrousel des réalisations. Flèches gauche et droite pour naviguer." className="relative h-[62svh] min-h-[420px] w-full cursor-grab select-none outline-offset-4 active:cursor-grabbing" style={{ touchAction: "pan-y" }}>
        <GalleryCanvas items={withCover} accent={accent} running={running} host={host} apiRef={api} onOpen={(slug) => viewer.open(slug)} lowPower={typeof window !== "undefined" && window.innerWidth < 900} />
      </section>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="muted text-[0.85rem]">Glissez, utilisez les flèches ou cliquez sur un écran pour l&apos;ouvrir.</p>
        <div className="flex gap-3">
          <button type="button" aria-label="Réalisation précédente" className="btn btn-ghost !min-h-[48px] !w-12 !px-0" onClick={() => api.current?.jump(-1)}>←</button>
          <button type="button" aria-label="Réalisation suivante" className="btn btn-ghost !min-h-[48px] !w-12 !px-0" onClick={() => api.current?.jump(1)}>→</button>
        </div>
      </div>
      <ul className="sr-only">
        {items.map((p) => (<li key={p.slug}><Link href={`/realisations/${p.slug}`}>{p.title} — {p.sector}</Link></li>))}
      </ul>
    </div>
  );
}

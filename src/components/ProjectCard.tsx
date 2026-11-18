"use client";
import Link from "next/link";
import Image from "next/image";
import { useViewer } from "./ProjectViewer";

type P = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean };

/** Carte de réalisation : grand visuel recadré au survol, titre qui glisse, invitation « Voir le projet » (toujours visible au toucher). */
export function ProjectCard({ p, priority = false, level = 3 }: { p: P; priority?: boolean; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  const v = useViewer();
  return (
    <Link href={`/realisations/${p.slug}`} className="pc group block" data-cursor="Ouvrir" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; if (v.open(p.slug)) e.preventDefault(); }}>
      <div className="pc-media relative aspect-[16/10] overflow-hidden bg-ivory-200">
        {p.cover ? (
          <Image src={p.cover} alt={`Aperçu du site ${p.title}`} fill sizes="(min-width:768px) 50vw, 100vw" priority={priority} className="pc-img object-cover" />
        ) : null}
        {p.isExample && <span className="pc-badge">Projet concept</span>}
        <span className="pc-cta" aria-hidden="true">Voir le projet <span>→</span></span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <H className="pc-title text-h3 font-medium">{p.title}</H>
          <p className="muted mt-1.5 max-w-[46ch] text-[0.97rem] leading-snug">{p.summary}</p>
        </div>
        <span className="muted mt-1 shrink-0 text-[0.85rem]">{p.sector}</span>
      </div>
    </Link>
  );
}

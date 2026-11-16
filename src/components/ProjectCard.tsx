"use client";
import Link from "next/link";
import Image from "next/image";
import { useViewer } from "./ProjectViewer";

type P = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean };

export function ProjectCard({ p, priority = false, level = 3 }: { p: P; priority?: boolean; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  const v = useViewer();
  return (
    <Link href={`/realisations/${p.slug}`} className="group block" data-cursor onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; if (v.open(p.slug)) e.preventDefault(); }}>
      <div className="chamfer relative aspect-[8/5] overflow-hidden border hair bg-ivory-200">
        {p.cover ? (
          <Image src={p.cover} alt={`Aperçu du site ${p.title}`} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" priority={priority} className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]" />
        ) : null}
        {p.isExample && <span className="absolute left-3 top-3 bg-ink-900/90 px-3 py-1 text-[0.72rem] uppercase tracking-[0.14em] text-ivory">Projet concept</span>}
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <H className="text-h3 font-medium">{p.title}</H>
          <p className="muted mt-1.5 max-w-[34ch] text-[0.97rem] leading-snug">{p.summary}</p>
        </div>
        <span className="muted mt-1 shrink-0 text-[0.8rem] uppercase tracking-[0.14em]">{p.sector}</span>
      </div>
    </Link>
  );
}

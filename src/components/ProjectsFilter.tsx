"use client";
import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";

type P = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean; services: string[] };

export function ProjectsFilter({ projects, sectors, services, level = 3 }: { level?: 2 | 3; projects: P[]; sectors: string[]; services: { slug: string; title: string }[] }) {
  const [sector, setSector] = useState("");
  const [service, setService] = useState("");
  const list = useMemo(() => projects.filter((p) => (!sector || p.sector === sector) && (!service || p.services.includes(service))), [projects, sector, service]);
  const chip = (on: boolean) => `min-h-[44px] rounded-full border px-4 py-2 text-[0.92rem] transition-colors ${on ? "border-ink-900 bg-ink-900 text-ivory" : "hair hover:bg-white"}`;
  return (
    <div>
      <div className="mb-12 grid gap-6 md:grid-cols-2" role="group" aria-label="Filtres">
        <div>
          <p className="label">Secteur</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!sector)} aria-pressed={!sector} onClick={() => setSector("")}>Tous</button>
            {sectors.map((s) => (<button key={s} type="button" className={chip(sector === s)} aria-pressed={sector === s} onClick={() => setSector(s)}>{s}</button>))}
          </div>
        </div>
        <div>
          <p className="label">Service</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!service)} aria-pressed={!service} onClick={() => setService("")}>Tous</button>
            {services.map((s) => (<button key={s.slug} type="button" className={chip(service === s.slug)} aria-pressed={service === s.slug} onClick={() => setService(s.slug)}>{s.title}</button>))}
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{list.length} réalisation(s) affichée(s)</p>
      {list.length === 0 ? (
        <p className="muted py-16 text-center">Aucune réalisation pour cette combinaison. Essayez un autre filtre.</p>
      ) : (
        <div className="grid gap-x-10 gap-y-16 md:grid-cols-2">{list.map((p) => (<ProjectCard key={p.slug} p={p} level={level} />))}</div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { ProjectsDesk, type DeskProject } from "./ProjectsDesk";
import { ProjectsFilter } from "./ProjectsFilter";

type FP = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean; services: string[] };

/** Réalisations : grille éditoriale par défaut ; « mode bureau » interactif proposé en option sur grand écran avec souris. */
export function RealisationsView({ desk, list, sectors, services }: { desk: DeskProject[]; list: FP[]; sectors: string[]; services: { slug: string; title: string }[] }) {
  const [wide, setWide] = useState(false);
  const [deskMode, setDeskMode] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const withCover = desk.filter((p) => p.cover);
  if (wide && deskMode && withCover.length > 0) return <ProjectsDesk projects={withCover} onListView={() => setDeskMode(false)} />;
  return (
    <div>
      {wide && withCover.length > 0 && (
        <div className="mb-10 flex justify-end"><button type="button" className="xp-link" onClick={() => setDeskMode(true)}>Explorer en mode bureau interactif <span aria-hidden="true">→</span></button></div>
      )}
      <ProjectsFilter level={2} projects={list} sectors={sectors} services={services} />
    </div>
  );
}

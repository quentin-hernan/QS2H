"use client";
import { useEffect, useState } from "react";
import { ProjectsDesk, type DeskProject } from "./ProjectsDesk";
import { ProjectsFilter } from "./ProjectsFilter";

type FP = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean; services: string[] };

/** Réalisations : « mode bureau » sur grand écran avec souris ; liste verticale (cartes + feuille plein écran) sur mobile ; vue liste classique toujours disponible. */
export function RealisationsView({ desk, list, sectors, services }: { desk: DeskProject[]; list: FP[]; sectors: string[]; services: { slug: string; title: string }[] }) {
  const [wide, setWide] = useState(false);
  const [classic, setClassic] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const withPlanes = desk.filter((p) => p.cover);
  if (wide && !classic && withPlanes.length > 0) return <ProjectsDesk projects={withPlanes} onListView={() => setClassic(true)} />;
  return (
    <div>
      {wide && classic && <button type="button" className="btn btn-outline mb-8 !min-h-[44px] !px-5 text-sm" onClick={() => setClassic(false)}>Revenir au bureau</button>}
      <ProjectsFilter level={2} projects={list} sectors={sectors} services={services} />
    </div>
  );
}

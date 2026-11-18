"use client";
import { useEffect, useState } from "react";
import { Sections } from "@/components/Sections";
import type { Section } from "@/lib/sections";

/** Aperçu réel d'une page libre : rendu dans un cadre de la largeur de l'appareil choisi, mis à jour par l'éditeur (postMessage). */
export default function Preview() {
  const [data, setData] = useState<{ sections: Section[]; title: string } | null>(null);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== "qs2h-preview") return;
      setData({ sections: e.data.sections as Section[], title: String(e.data.title ?? "") });
    };
    const stop = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); };
    addEventListener("message", on);
    document.addEventListener("click", stop, true);
    parent.postMessage({ type: "qs2h-preview-ready" }, location.origin);
    return () => { removeEventListener("message", on); document.removeEventListener("click", stop, true); };
  }, []);
  return (
    <div className="site-shell pv">
      {data ? <Sections sections={data.sections} title={data.title} /> : <p className="muted p-10 text-center">Chargement de l&apos;aperçu…</p>}
    </div>
  );
}

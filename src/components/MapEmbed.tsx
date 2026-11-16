"use client";
import { useState } from "react";

/** Carte OpenStreetMap chargée uniquement au clic (aucun traceur tiers avant action de l'utilisateur). */
export function MapEmbed({ city }: { city: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden chamfer border hair bg-ivory-200">
      {on ? (
        <iframe title={`Carte : ${city}`} loading="lazy" className="h-full w-full" src="https://www.openstreetmap.org/export/embed.html?bbox=-0.66%2C44.80%2C-0.50%2C44.88&layer=mapnik" />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-ink-900 transition-colors hover:bg-ivory-300/50">
          <span className="font-serif text-3xl italic">{city}</span>
          <span className="max-w-[28ch] text-[0.9rem] text-mute-light">Afficher la carte (OpenStreetMap). Des données sont échangées avec un service tiers au clic.</span>
          <span className="pointer-events-none inline-flex min-h-[48px] items-center border px-7 text-[0.95rem] font-medium" style={{ borderColor: "rgb(12 14 17 / .25)" }}>Afficher la carte</span>
        </button>
      )}
    </div>
  );
}

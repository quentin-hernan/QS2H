"use client";
import { useEffect } from "react";

/** Événement de conversion (Plausible). Sans effet si la mesure d'audience n'a pas été acceptée. */
export function Conversion({ event }: { event: string }) {
  useEffect(() => {
    const w = window as unknown as { plausible?: (n: string) => void };
    const t = setTimeout(() => w.plausible?.(event), 600);
    return () => clearTimeout(t);
  }, [event]);
  return null;
}

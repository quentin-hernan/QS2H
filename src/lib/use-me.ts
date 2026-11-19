"use client";
import { useEffect, useState } from "react";

export type Me = { firstName: string; lastName: string; name: string; email: string; phone: string; company: string };
let cache: Me | null | undefined;
let inflight: Promise<Me | null> | null = null;

/** Client connecté (ou null) : `undefined` tant que la réponse n'est pas arrivée. Sert à préremplir les formulaires et à ne demander que les informations manquantes. */
export function useMe(): Me | null | undefined {
  const [me, setMe] = useState<Me | null | undefined>(cache);
  useEffect(() => {
    if (cache !== undefined) { setMe(cache); return; }
    inflight ??= fetch("/api/compte/me", { cache: "no-store" }).then((r) => r.json()).then((j) => (cache = j?.me ?? null)).catch(() => (cache = null)).finally(() => { inflight = null; });
    inflight.then((m) => setMe(m));
  }, []);
  return me;
}
export const forgetMe = () => { cache = undefined; };

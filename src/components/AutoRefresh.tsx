"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Met à jour les données affichées sans recharger la page (compteurs, listes, statuts) :
 * à intervalle régulier, au retour sur l'onglet et dès qu'une nouvelle notification arrive.
 * Jamais pendant une saisie, une fenêtre ouverte ou l'éditeur visuel, pour ne rien perturber.
 */
export function AutoRefresh({ every = 20000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    let last = 0;
    const busy = () => {
      const a = document.activeElement as HTMLElement | null;
      return (!!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) || !!document.querySelector("dialog[open]") || document.documentElement.classList.contains("sx-editing");
    };
    const tick = () => {
      if (document.hidden || busy() || Date.now() - last < 4000) return;
      last = Date.now();
      router.refresh();
    };
    const t = setInterval(tick, every);
    const vis = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", vis);
    addEventListener("qs2h:notice", tick);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); removeEventListener("qs2h:notice", tick); };
  }, [router, every]);
  return null;
}

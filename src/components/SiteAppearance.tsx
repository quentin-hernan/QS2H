"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { applyStyle, listSections, startParallax } from "./sectionDom";
import type { StyleMap } from "@/lib/section-style";
import { applyOverrides, type OverridesMap } from "@/lib/overrides";

const SectionEditor = dynamic(() => import("./SectionEditor").then((m) => m.SectionEditor), { ssr: false });

/**
 * Applique à chaque page les réglages d'apparence enregistrés dans l'admin (fond, animations, espacement)
 * et, pour un administrateur connecté, propose l'éditeur visuel.
 */
export function SiteAppearance({ styles, overrides = {} }: { styles: StyleMap; overrides?: OverridesMap }) {
  const path = usePathname();
  const [admin, setAdmin] = useState(false);

  // application des réglages de la page courante (après hydratation, puis à nouveau quand le contenu a fini de se monter)
  useEffect(() => {
    const entries = styles[path] ?? {};
    const run = () => {
      const secs = listSections();
      secs.forEach((s, i) => {
        const e = entries[String(i)]; // rattachement par ordre de section dans la page
        if (e && !s.el.hasAttribute("data-sx-edit")) applyStyle(s.el, e.style);
      });
    };
    const t1 = setTimeout(run, 60), t2 = setTimeout(run, 900);
    // textes et images modifiés directement sur la page (plusieurs passes : certains contenus se montent après coup)
    const ovRun = () => applyOverrides(overrides[path]);
    const o1 = setTimeout(ovRun, 80), o2 = setTimeout(ovRun, 900), o3 = setTimeout(ovRun, 2600);
    const stop = startParallax();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(o1); clearTimeout(o2); clearTimeout(o3); stop(); };
  }, [path, styles, overrides]);

  // un cookie témoin (sans secret) indique qu'une session d'administration existe ; l'API confirme
  useEffect(() => {
    const wanted = /(?:^|; )qs2h_ui=1/.test(document.cookie) || new URLSearchParams(location.search).get("edit") === "1";
    if (!wanted) return;
    fetch("/api/admin/me").then((r) => r.json()).then((j) => setAdmin(!!j.admin)).catch(() => {});
  }, [path]);

  return admin ? <SectionEditor styles={styles} overrides={overrides} /> : null;
}

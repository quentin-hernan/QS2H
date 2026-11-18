import "server-only";
import { db } from "./db";
import { cgu, cgv, cgvVente, confidentialite, cookies, mentionsLegales, type LegalSection } from "./legal";
import type { Company } from "./defaults";

export type DocKey = "mentions" | "confidentialite" | "cgu" | "cgv" | "vente" | "cookies";
export const LEGAL_DOCS: Record<DocKey, { title: string; path: string; description: string; template: (c: Company) => LegalSection[] }> = {
  mentions: { title: "Mentions légales", path: "/mentions-legales", description: "Mentions légales (LCEN) de QS2H : éditeur, hébergeur, contact.", template: mentionsLegales },
  confidentialite: { title: "Politique de confidentialité", path: "/politique-de-confidentialite", description: "Comment QS2H collecte, utilise et protège vos données personnelles, et comment exercer vos droits.", template: confidentialite },
  cgu: { title: "Conditions générales d'utilisation", path: "/cgu", description: "Conditions d'utilisation de l'espace client QS2H.", template: cgu },
  cgv: { title: "Conditions générales de vente", path: "/cgv", description: "Conditions générales de vente des prestations de création, refonte et maintenance de sites web de QS2H.", template: cgv },
  vente: { title: "Conditions générales de vente — Boutique", path: "/cgv-boutique", description: "Conditions de vente de la boutique en ligne QS2H : commande, prix, livraison, droit de rétractation, garanties.", template: cgvVente },
  cookies: { title: "Politique de cookies", path: "/politique-de-cookies", description: "Les cookies et traceurs utilisés par le site QS2H, et comment gérer votre consentement.", template: () => cookies() },
};

export const sectionsToHtml = (s: LegalSection[]) => s.map((x) => `<h2>${x.h}</h2>${x.p.map((t) => `<p>${t}</p>`).join("")}`).join("");

export async function latestLegal(doc: DocKey) {
  return db.legalVersion.findFirst({ where: { doc }, orderBy: { version: "desc" } });
}
/** Numéro de version en vigueur (1 = modèle généré tant qu'aucune version n'a été enregistrée). */
export async function legalVersionNumber(doc: DocKey) {
  return (await latestLegal(doc))?.version ?? 1;
}
export async function legalHistory(doc: DocKey) {
  return db.legalVersion.findMany({ where: { doc }, orderBy: { version: "desc" }, select: { version: true, createdAt: true, major: true, note: true } });
}

/** Sections des pages libres : définition partagée entre l'éditeur (admin), la validation serveur et l'affichage public. */
export type FieldDef = { name: string; label: string; type: "text" | "textarea" | "media" | "select"; options?: { value: string; label: string }[]; placeholder?: string };
export type SectionType = "hero" | "text" | "media" | "columns" | "faq" | "cta";
export type ListDef = { name: string; label: string; addLabel: string; max: number; fields: FieldDef[] };
export type SectionDef = { type: SectionType; label: string; hint: string; fields: FieldDef[]; list?: ListDef };
export type Item = Record<string, string>;
export type SectionData = Record<string, string | Item[]>;
export type Section = { id: string; type: SectionType; d: SectionData };

const TONE: FieldDef = { name: "tone", label: "Fond", type: "select", options: [{ value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }] };
const MEDIA: FieldDef[] = [
  { name: "src", label: "Image ou vidéo (tout format, 16:9 conseillé)", type: "media" },
  { name: "alt", label: "Texte alternatif (décrit le visuel)", type: "text" },
];

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero", label: "Bandeau d'introduction", hint: "Grand titre, texte, bouton et visuel.",
    fields: [
      { name: "eyebrow", label: "Sur-titre", type: "text" },
      { name: "title", label: "Titre", type: "text" },
      { name: "text", label: "Texte", type: "textarea" },
      { name: "buttonLabel", label: "Texte du bouton", type: "text" },
      { name: "buttonHref", label: "Lien du bouton (/contact, https://…)", type: "text" },
      ...MEDIA,
      { ...TONE, options: [{ value: "dark", label: "Sombre" }, { value: "light", label: "Clair" }] },
    ],
  },
  { type: "text", label: "Texte", hint: "Titre et paragraphes.", fields: [{ name: "eyebrow", label: "Sur-titre", type: "text" }, { name: "title", label: "Titre", type: "text" }, { name: "body", label: "Texte (séparez les paragraphes par une ligne vide)", type: "textarea" }, { name: "align", label: "Alignement", type: "select", options: [{ value: "left", label: "À gauche" }, { value: "center", label: "Centré" }] }, TONE] },
  { type: "media", label: "Image ou vidéo 16:9", hint: "Grand visuel pleine largeur avec légende.", fields: [...MEDIA, { name: "title", label: "Titre (facultatif)", type: "text" }, { name: "text", label: "Légende (facultatif)", type: "textarea" }, TONE] },
  {
    type: "columns", label: "Colonnes", hint: "2 à 4 blocs côte à côte (avantages, produits, étapes…).",
    fields: [{ name: "title", label: "Titre de la section", type: "text" }, TONE],
    list: { name: "items", label: "Blocs", addLabel: "Ajouter un bloc", max: 8, fields: [{ name: "title", label: "Titre", type: "text" }, { name: "text", label: "Texte", type: "textarea" }, ...MEDIA] },
  },
  {
    type: "faq", label: "Questions fréquentes", hint: "Liste de questions et réponses.",
    fields: [{ name: "title", label: "Titre de la section", type: "text" }, TONE],
    list: { name: "items", label: "Questions", addLabel: "Ajouter une question", max: 30, fields: [{ name: "q", label: "Question", type: "text" }, { name: "a", label: "Réponse", type: "textarea" }] },
  },
  { type: "cta", label: "Appel à l'action", hint: "Titre, texte et bouton.", fields: [{ name: "title", label: "Titre", type: "text" }, { name: "text", label: "Texte", type: "textarea" }, { name: "buttonLabel", label: "Texte du bouton", type: "text" }, { name: "buttonHref", label: "Lien du bouton (/contact, https://…)", type: "text" }, TONE] },
];

export const defOf = (t: string) => SECTION_DEFS.find((d) => d.type === t);

export function newSection(type: SectionType): Section {
  const def = defOf(type)!;
  const d: SectionData = {};
  for (const f of def.fields) d[f.name] = f.type === "select" ? f.options![0].value : "";
  if (def.list) d[def.list.name] = [];
  if (type === "hero") { d.title = "Titre de la page"; d.buttonLabel = "Demander un devis"; d.buttonHref = "/contact"; }
  if (type === "text") d.title = "Titre de la section";
  if (type === "cta") { d.title = "Parlons de votre projet."; d.buttonLabel = "Demander un devis"; d.buttonHref = "/contact"; }
  return { id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2), type, d };
}

/** Lien autorisé : chemin interne, https ou mailto. */
export const safeHref = (h: string) => (/^(\/(?!\/)|https:\/\/|mailto:)/.test(h.trim()) ? h.trim() : "");

/** Nettoie des sections reçues du navigateur : types connus, champs connus, longueurs bornées. */
export function cleanSections(input: unknown): Section[] {
  if (!Array.isArray(input)) return [];
  const out: Section[] = [];
  for (const raw of input.slice(0, 40)) {
    const r = raw as { id?: unknown; type?: unknown; d?: Record<string, unknown> };
    const def = defOf(String(r?.type));
    if (!def) continue;
    const d: SectionData = {};
    for (const f of def.fields) {
      let v = String(r.d?.[f.name] ?? "").slice(0, 8000);
      if (f.name === "buttonHref") v = safeHref(v);
      if (f.name === "src" && v && !/^(\/|https:\/\/)/.test(v)) v = "";
      if (f.type === "select" && !f.options!.some((o) => o.value === v)) v = f.options![0].value;
      d[f.name] = v;
    }
    if (def.list) {
      const items = Array.isArray(r.d?.[def.list.name]) ? (r.d![def.list.name] as unknown[]) : [];
      d[def.list.name] = items.slice(0, def.list.max).map((it) => Object.fromEntries(def.list!.fields.map((f) => {
        let v = String((it as Record<string, unknown>)?.[f.name] ?? "").slice(0, 4000);
        if (f.name === "src" && v && !/^(\/|https:\/\/)/.test(v)) v = "";
        return [f.name, v];
      }))).filter((o) => Object.values(o).some((x) => x.trim()));
    }
    out.push({ id: String(r.id ?? "").slice(0, 60) || newSection(def.type).id, type: def.type, d });
  }
  return out;
}

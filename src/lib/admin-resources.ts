/** Description déclarative des ressources éditables dans /admin. Le formulaire, la liste et la validation serveur en sont générés. */
export type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "slug" | "image" | "images" | "list" | "objlist" | "multiselect" | "datetime" | "richtext" | "planes" | "meta";
export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[] | "services";
  itemFields?: { name: string; label: string; type: "text" | "textarea" }[];
  hint?: string;
  rows?: number;
  from?: string; // champ source pour générer un slug
  max?: number;
  half?: boolean;
};
export type Resource = {
  key: string; // segment d'URL /admin/<key>
  label: string;
  singular: string;
  model: "project" | "service" | "plan" | "planOption" | "faq" | "review" | "post" | "teamMember" | "redirect";
  titleField: string;
  columns: { name: string; label: string }[];
  fields: Field[];
  json: string[]; // champs stockés en JSON texte
  orderable: boolean;
  statusField?: { name: string; published: string; draft: string } | { name: string; bool: true };
  duplicable?: boolean;
  preview?: "post" | "project";
  help?: string;
};

const STATUS: Option[] = [{ value: "draft", label: "Brouillon" }, { value: "published", label: "Publié" }];

export const resources: Resource[] = [
  {
    key: "realisations", label: "Réalisations", singular: "réalisation", model: "project", titleField: "title", orderable: true, duplicable: true, preview: "project",
    statusField: { name: "status", published: "published", draft: "draft" },
    json: ["services", "results", "technologies", "images", "planes", "meta"],
    columns: [{ name: "title", label: "Titre" }, { name: "sector", label: "Secteur" }, { name: "status", label: "Statut" }],
    help: "Trois façons d'ajouter une réalisation : coller l'adresse du site (capture automatique), importer des images, ou composer les plans à la main. Les projets « concept » sont des démonstrations QS2H : remplacez-les par de vraies réalisations.",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "slug", label: "Adresse (slug)", type: "slug", from: "title", required: true, half: true },
      { name: "client", label: "Client", type: "text", required: true, half: true },
      { name: "sector", label: "Secteur", type: "text", required: true, half: true, hint: "Ex. Artisan, Restaurant, Cabinet…" },
      { name: "status", label: "Statut", type: "select", options: STATUS, required: true, half: true },
      { name: "isExample", label: "Projet concept (réalisé par QS2H pour démonstration, sans client : affiche le badge « Projet concept »)", type: "boolean" },
      { name: "authorized", label: "J'ai l'autorisation du client de présenter ce projet (obligatoire pour publier un projet client)", type: "boolean" },
      { name: "authorizedNote", label: "Note interne sur l'autorisation (date, moyen, interlocuteur)", type: "text" },
      { name: "year", label: "Année", type: "number", half: true },
      { name: "duration", label: "Durée réelle du projet (du brief à la mise en ligne)", type: "text", half: true, hint: "Ex. « 5 semaines ». Laissez vide si inconnue." },
      { name: "beforeImage", label: "Capture AVANT refonte (affiche le curseur Avant / Après)", type: "image" },
      { name: "services", label: "Services concernés", type: "multiselect", options: "services" },
      { name: "summary", label: "Description courte", type: "textarea", required: true, rows: 3, max: 300 },
      { name: "challenge", label: "Contexte et objectifs", type: "textarea", rows: 4 },
      { name: "solution", label: "Solution apportée", type: "textarea", rows: 4 },
      { name: "results", label: "Résultats chiffrés", type: "objlist", itemFields: [{ name: "value", label: "Valeur (ex. +9)", type: "text" }, { name: "label", label: "Intitulé", type: "text" }] },
      { name: "technologies", label: "Technologies", type: "list", hint: "Une par ligne." },
      { name: "url", label: "URL du site", type: "text", hint: "https://…" },
      { name: "cover", label: "Image de couverture (aussi utilisée dans la scène 3D)", type: "image" },
      { name: "planes", label: "Plans de la vue éclatée 3D", type: "planes" },
      { name: "meta", label: "Données de capture", type: "meta" },
      { name: "testimonial", label: "Témoignage", type: "textarea", rows: 3 },
      { name: "testimonialBy", label: "Auteur du témoignage", type: "text" },
      { name: "seoTitle", label: "Titre SEO", type: "text", max: 70, hint: "60 caractères conseillés." },
      { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 170, hint: "150 caractères conseillés." },
    ],
  },
  {
    key: "services", label: "Services", singular: "service", model: "service", titleField: "title", orderable: true, duplicable: true,
    statusField: { name: "published", bool: true },
    json: ["deliverables", "faq"],
    columns: [{ name: "title", label: "Titre" }, { name: "priceFrom", label: "Dès (€)" }, { name: "published", label: "Publié" }],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "slug", label: "Adresse (slug)", type: "slug", from: "title", required: true, half: true },
      { name: "published", label: "Publié", type: "boolean", half: true },
      { name: "tagline", label: "Accroche", type: "textarea", required: true, rows: 2 },
      { name: "problem", label: "Le problème du client", type: "textarea", required: true, rows: 4 },
      { name: "solution", label: "Notre solution", type: "textarea", required: true, rows: 4 },
      { name: "deliverables", label: "Livrables", type: "list", hint: "Un par ligne." },
      { name: "duration", label: "Délai indicatif", type: "text", half: true },
      { name: "priceFrom", label: "À partir de (€)", type: "number", half: true },
      { name: "priceUnit", label: "Unité du prix", type: "text", half: true, hint: "Ex. « € HT » ou « € HT / mois »" },
      { name: "faq", label: "Questions fréquentes du service", type: "objlist", itemFields: [{ name: "q", label: "Question", type: "text" }, { name: "a", label: "Réponse", type: "textarea" }] },
      { name: "seoTitle", label: "Titre SEO", type: "text", max: 70 },
      { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 170 },
    ],
  },
  {
    key: "tarifs", label: "Formules tarifaires", singular: "formule", model: "plan", titleField: "name", orderable: true, duplicable: true,
    json: ["features"],
    columns: [{ name: "name", label: "Nom" }, { name: "price", label: "Prix" }, { name: "highlighted", label: "Mise en avant" }],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true, half: true },
      { name: "price", label: "Prix affiché", type: "text", required: true, half: true, hint: "Ex. « 990 € » ou « Sur devis »" },
      { name: "priceNote", label: "Mention (HT…)", type: "text", half: true },
      { name: "cta", label: "Texte du bouton", type: "text", half: true },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      { name: "features", label: "Contenu de la formule", type: "list", hint: "Une ligne par élément." },
      { name: "highlighted", label: "Mettre en avant (« Le plus demandé »)", type: "boolean" },
    ],
  },
  {
    key: "options", label: "Options tarifaires", singular: "option", model: "planOption", titleField: "name", orderable: true,
    json: [],
    columns: [{ name: "name", label: "Nom" }, { name: "price", label: "Tarif" }],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true, half: true },
      { name: "price", label: "Tarif", type: "text", required: true, half: true },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
    ],
  },
  {
    key: "faq", label: "FAQ", singular: "question", model: "faq", titleField: "question", orderable: true,
    json: [],
    columns: [{ name: "question", label: "Question" }],
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Réponse", type: "textarea", required: true, rows: 5 },
    ],
  },
  {
    key: "avis", label: "Avis clients", singular: "avis", model: "review", titleField: "author", orderable: true,
    statusField: { name: "visible", bool: true },
    json: [],
    columns: [{ name: "author", label: "Auteur" }, { name: "company", label: "Entreprise" }, { name: "rating", label: "Note" }, { name: "visible", label: "Visible" }],
    help: "Seuls les avis réels (non « exemple ») alimentent la note globale envoyée à Google.",
    fields: [
      { name: "author", label: "Auteur", type: "text", required: true, half: true },
      { name: "rating", label: "Note (1 à 5)", type: "number", required: true, half: true },
      { name: "role", label: "Fonction", type: "text", half: true },
      { name: "company", label: "Entreprise", type: "text", half: true },
      { name: "text", label: "Avis", type: "textarea", required: true, rows: 4 },
      { name: "visible", label: "Afficher sur le site", type: "boolean", half: true },
      { name: "isExample", label: "Avis d'exemple (à remplacer)", type: "boolean", half: true },
    ],
  },
  {
    key: "articles", label: "Articles de blog", singular: "article", model: "post", titleField: "title", orderable: false, duplicable: true, preview: "post",
    statusField: { name: "status", published: "published", draft: "draft" },
    json: [],
    columns: [{ name: "title", label: "Titre" }, { name: "category", label: "Catégorie" }, { name: "status", label: "Statut" }, { name: "publishedAt", label: "Publication" }],
    help: "Planification : choisissez « Publié » avec une date future, l'article apparaîtra à cette date.",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "slug", label: "Adresse (slug)", type: "slug", from: "title", required: true, half: true },
      { name: "category", label: "Catégorie", type: "text", required: true, half: true },
      { name: "author", label: "Auteur", type: "text", half: true },
      { name: "status", label: "Statut", type: "select", options: STATUS, required: true, half: true },
      { name: "publishedAt", label: "Date de publication", type: "datetime", hint: "Laisser vide : publié immédiatement." },
      { name: "excerpt", label: "Extrait", type: "textarea", required: true, rows: 3, max: 300 },
      { name: "cover", label: "Image à la une", type: "image" },
      { name: "content", label: "Contenu", type: "richtext", required: true },
      { name: "seoTitle", label: "Titre SEO", type: "text", max: 70 },
      { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 170 },
    ],
  },
  {
    key: "equipe", label: "Équipe", singular: "membre", model: "teamMember", titleField: "name", orderable: true,
    json: [],
    columns: [{ name: "name", label: "Nom" }, { name: "role", label: "Rôle" }],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true, half: true },
      { name: "role", label: "Rôle", type: "text", required: true, half: true },
      { name: "bio", label: "Présentation", type: "textarea", rows: 4 },
      { name: "photo", label: "Photo", type: "image" },
    ],
  },
  {
    key: "redirections", label: "Redirections", singular: "redirection", model: "redirect", titleField: "from", orderable: false,
    json: [],
    columns: [{ name: "from", label: "De" }, { name: "to", label: "Vers" }, { name: "permanent", label: "301" }],
    help: "Utile après une refonte : redirigez les anciennes adresses vers les nouvelles pour conserver le référencement.",
    fields: [
      { name: "from", label: "Ancienne adresse", type: "text", required: true, hint: "Commence par /, ex. /ancienne-page" },
      { name: "to", label: "Nouvelle adresse", type: "text", required: true, hint: "/nouvelle-page ou https://…" },
      { name: "permanent", label: "Redirection permanente (301)", type: "boolean" },
    ],
  },
];

export const resourceByKey = (k: string) => resources.find((r) => r.key === k);

export const LEAD_STATUSES = ["nouveau", "contacté", "devis envoyé", "gagné", "perdu"] as const;

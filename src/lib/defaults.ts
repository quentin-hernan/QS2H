/** Valeurs par défaut du site. Tout est surchargeable depuis /admin (Paramètres, Pages et textes). */

export type Company = typeof defaultSettings.company;
export type SiteSettings = typeof defaultSettings;

import type { StyleMap } from "./section-style";

export const defaultSettings = {
  company: {
    name: "QS2H",
    tagline: "Solutions digitales",
    legalName: "QS2H",
    legalForm: "[SASU / EI / SAS]",
    capital: "[X] €",
    siren: "[XXX XXX XXX]",
    siret: "[XXX XXX XXX XXXXX]",
    tva: "[FRXXXXXXXXXXX]",
    address: "[adresse]",
    zip: "[code postal]",
    city: "Bordeaux",
    phone: "[+33 X XX XX XX XX]",
    email: "contact@qs2h.fr",
    hours: "Lundi – vendredi, 9 h – 18 h",
    area: "France entière, à distance. Rendez-vous en visio, ou sur place à Bordeaux et en Gironde.",
    director: "[Nom du directeur de la publication]",
    hostName: "Vercel Inc.",
    hostAddress: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    mediator: "[Nom et coordonnées du médiateur de la consommation]",
    dpoEmail: "contact@qs2h.fr",
  },
  theme: { accent: "#2A5587" },
  social: { linkedin: "", instagram: "", facebook: "" },
  integrations: { calendlyUrl: "", plausibleDomain: "", searchConsoleToken: "" },
  booking: { mon: "09:00-12:00,14:00-18:00", tue: "09:00-12:00,14:00-18:00", wed: "09:00-12:00,14:00-18:00", thu: "09:00-12:00,14:00-18:00", fri: "09:00-12:00,14:00-17:00", sat: "", sun: "", buffer: "15", maxPerDay: "6", noticeHours: "24", horizonDays: "45", closed: "" },
  sectionStyles: {} as StyleMap,
  footerText: "Solutions digitales pour les professionnels : sites web, marketing, automatisation, chatbots et outils sur mesure. Basés à Bordeaux, avec des clients dans toute la France.",
  trust: [
    { value: "24 h", label: "pour recevoir votre devis (jours ouvrés)" },
    { value: "3 à 4 sem.", label: "délai indicatif d'un site vitrine" },
    { value: "100 %", label: "du site vous appartient à la livraison" },
    { value: "1", label: "seul interlocuteur, du cadrage au suivi" },
  ],
};

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "list" | "media";
  hint?: string;
  itemFields?: { name: string; label: string; type: "text" | "textarea" | "media" }[];
};
/** Emplacements média 16:9 (image ou vidéo) modifiables depuis l'admin. Vide = section masquée. */
export const mediaField: FieldDef = {
  name: "media",
  label: "Visuels pleine largeur (image ou vidéo, format 16:9 conseillé)",
  type: "list",
  hint: "Chaque ligne crée un grand visuel dans la page. Images : JPEG, PNG, WebP, AVIF, GIF. Vidéos : MP4, WebM, MOV (lecture muette en boucle). Aucune ligne = aucun visuel.",
  itemFields: [
    { name: "src", label: "Image ou vidéo", type: "media" },
    { name: "alt", label: "Texte alternatif (décrit le visuel)", type: "text" },
    { name: "title", label: "Titre (facultatif)", type: "text" },
    { name: "text", label: "Légende (facultatif)", type: "textarea" },
  ],
};
export const heroImageField: FieldDef = { name: "heroImage", label: "Image ou vidéo du bandeau d'en-tête (facultatif, 16:9 conseillé)", type: "media" };
export type PageSchema = { key: string; label: string; fields: FieldDef[]; defaults: Record<string, unknown> };

export const pageSchemas: PageSchema[] = [
  {
    key: "home",
    label: "Accueil",
    fields: [
      mediaField,
      { name: "kicker", label: "Sur-titre", type: "text" },
      { name: "line1", label: "Titre — ligne 1 (derrière l'objet 3D)", type: "text" },
      { name: "line2", label: "Titre — ligne 2 (derrière l'objet 3D)", type: "text" },
      { name: "line3", label: "Titre — ligne 3 (devant, en accent)", type: "text" },
      { name: "lead", label: "Introduction", type: "textarea" },
      { name: "ctaPrimary", label: "Bouton principal", type: "text" },
      { name: "ctaSecondary", label: "Bouton secondaire", type: "text" },
      {
        name: "layers",
        label: "Vue éclatée — couches",
        type: "list",
        itemFields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "text", label: "Texte", type: "textarea" },
        ],
      },
      { name: "servicesTitle", label: "Titre de la section expertises", type: "text" },
      { name: "servicesLead", label: "Introduction des expertises", type: "textarea" },
      { name: "servicesBg", label: "Image ou vidéo de fond de la section expertises (facultatif)", type: "media" },
      { name: "introLine1", label: "Présentation — phrase 1", type: "text" },
      { name: "introLine2", label: "Présentation — phrase 2", type: "text" },
      { name: "introText", label: "Présentation — texte", type: "textarea" },
      { name: "introBg", label: "Présentation — image ou vidéo de fond (facultatif ; sans fichier, un dessin animé est affiché)", type: "media" },
      { name: "expertises", label: "Expertises (titre, texte, lien)", type: "list", itemFields: [{ name: "title", label: "Titre", type: "text" }, { name: "text", label: "Texte", type: "textarea" }, { name: "href", label: "Lien (ex. /services)", type: "text" }] },
      { name: "demoTitle", label: "Démonstrations — titre", type: "text" },
      { name: "demoText", label: "Démonstrations — texte", type: "textarea" },
      { name: "whyTitle", label: "Pourquoi QS2H — titre", type: "text" },
      { name: "why", label: "Pourquoi QS2H — arguments", type: "list", itemFields: [{ name: "title", label: "Argument", type: "text" }, { name: "text", label: "Texte", type: "textarea" }] },
      { name: "finalCta", label: "Appel final — texte du bouton", type: "text" },
      { name: "ctaTitle", label: "Titre de l'appel final", type: "text" },
      { name: "ctaText", label: "Texte de l'appel final", type: "textarea" },
    ],
    defaults: {
      media: [],
      kicker: "QS2H · Solutions digitales pour les professionnels",
      line1: "Le digital pensé",
      line2: "pour faire avancer",
      line3: "votre entreprise.",
      lead: "Sites web, marketing, automatisation et solutions sur mesure. QS2H transforme vos idées en outils concrets pour développer votre activité.",
      ctaPrimary: "Parler de mon projet",
      ctaSecondary: "Découvrir nos solutions",
      layers: [
        { title: "Design", text: "Une identité visuelle qui inspire confiance dès la première seconde. La maquette est validée avec vous avant la moindre ligne de code." },
        { title: "Contenu", text: "Des textes écrits pour vos clients, pas pour les robots. Chaque page répond à une question précise que vos prospects se posent." },
        { title: "Code", text: "Un code propre, sans extension superflue. Il se charge vite, se modifie facilement et vous appartient entièrement." },
        { title: "Référencement", text: "Structure, balises, données structurées, fiche Google : les bases pour apparaître quand on cherche votre métier près de chez vous." },
        { title: "Performance", text: "Images optimisées, chargement différé, mobile d'abord. Un site rapide est mieux classé et fait plus de demandes de contact." },
      ],
      servicesBg: "",
      servicesTitle: "Nos expertises",
      servicesLead: "Cinq savoir-faire complémentaires, une même exigence : des outils qui servent vraiment votre activité.",
      ctaTitle: "Votre prochain projet commence ici.",
      ctaText: "Décrivez votre besoin en quelques lignes. Nous revenons vers vous sous 24 heures ouvrées avec une première réponse concrète.",
      introLine1: "Des idées ambitieuses.",
      introLine2: "Des solutions concrètes.",
      introText: "QS2H accompagne les indépendants, TPE et PME dans tout ce qui touche au digital : un site qui présente bien votre activité, une visibilité qui attire les bons clients, des automatisations qui libèrent du temps et des outils pensés pour votre façon de travailler. Un seul interlocuteur, un langage clair, des livrables que vous utilisez dès le premier jour.",
      expertises: [{"title":"Création de sites web","text":"Un site rapide, clair et facile à mettre à jour, conçu pour transformer vos visiteurs en demandes de contact.","href":"/services"},{"title":"Marketing digital","text":"Référencement, fiche Google, contenus et campagnes : être trouvé par les clients qui cherchent ce que vous proposez.","href":"/services"},{"title":"Automatisation","text":"Relances, devis, factures, synchronisation entre vos outils : les tâches répétitives se font seules, sans erreur de saisie.","href":"/contact?formule=Automatisation"},{"title":"Chatbots et assistants","text":"Un assistant qui répond aux questions courantes de vos clients à toute heure et vous transmet les demandes qualifiées.","href":"/contact?formule=Chatbot"},{"title":"Matrices et outils sur mesure","text":"Tableaux de suivi, calculateurs, matrices de décision : des outils structurés, adaptés à votre activité et simples à utiliser.","href":"/contact?formule=Matrices%20et%20outils"}],
      demoTitle: "Voyez à quoi ressemble le travail.",
      demoText: "Choisissez une solution : l'écran présente une maquette illustrative de ce que nous construisons. Les projets réels sont dans nos réalisations.",
      whyTitle: "Pourquoi QS2H ?",
      why: [{"title":"Une approche personnalisée.","text":"Pas de solution toute faite : nous partons de votre activité et de vos contraintes réelles."},{"title":"Des solutions adaptées à vos besoins.","text":"Nous recommandons ce qui vous sert, y compris quand c'est plus simple que prévu."},{"title":"Une vision transversale du digital.","text":"Site, visibilité, automatisation et outils sont pensés ensemble, pas chacun de leur côté."},{"title":"Un accompagnement clair.","text":"Un interlocuteur unique, des étapes connues à l'avance, un vocabulaire sans jargon."},{"title":"Des outils faits pour être utilisés.","text":"Chaque livrable est pensé pour votre quotidien et expliqué pour que vous restiez autonome."}],
      finalCta: "Discutons de votre projet",
    },
  },
  {
    key: "method",
    label: "Méthode",
    fields: [
      heroImageField,
      mediaField,
      { name: "title", label: "Titre", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "phasesTitle", label: "Vue d'ensemble — titre", type: "text" },
      { name: "phases", label: "Vue d'ensemble — 5 phases", type: "list", itemFields: [{ name: "title", label: "Phase", type: "text" }, { name: "text", label: "Texte", type: "textarea" }] },
      {
        name: "steps",
        label: "Étapes détaillées (avec durées)",
        type: "list",
        itemFields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "duration", label: "Durée indicative", type: "text" },
          { name: "text", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      phasesTitle: "Notre méthode",
      phases: [
        { title: "Découverte", text: "Nous écoutons votre activité, vos clients et vos objectifs avant de proposer quoi que ce soit." },
        { title: "Stratégie", text: "Nous définissons ensemble le périmètre, les priorités et le budget, écrits dans un devis clair." },
        { title: "Création", text: "Maquettes, développement, contenus : vous validez chaque étape avant la suivante." },
        { title: "Déploiement", text: "Mise en ligne, configuration et prise en main : tout vous est remis et expliqué." },
        { title: "Suivi", text: "Après le lancement, nous restons disponibles pour faire évoluer vos outils." },
      ],
      media: [],
      title: "Une méthode claire, du premier échange à la mise en ligne.",
      intro: "Chaque projet suit les mêmes sept étapes. Vous savez toujours où nous en sommes, ce qui est attendu de vous, et ce que vous paierez.",
      steps: [
        { title: "Audit", duration: "1 à 2 jours", text: "Nous étudions votre activité, votre site actuel s'il existe, vos concurrents et la façon dont vos clients vous cherchent sur Google." },
        { title: "Cadrage", duration: "2 à 3 jours", text: "Nous définissons ensemble les pages, les objectifs et le budget. Vous recevez un devis à prix fixe, signé avant tout démarrage." },
        { title: "Maquette", duration: "1 semaine", text: "Nous dessinons les pages principales. Vous donnez vos retours, nous ajustons. Aucun développement ne commence sans votre accord." },
        { title: "Développement", duration: "1 à 3 semaines", text: "Intégration, animations, formulaires, référencement. Vous suivez l'avancement sur une version de test accessible en ligne." },
        { title: "Recette", duration: "2 à 4 jours", text: "Tests sur ordinateur, tablette et téléphone, vérification de la vitesse et de l'accessibilité. Vous validez point par point." },
        { title: "Mise en ligne", duration: "1 jour", text: "Publication sur votre nom de domaine, redirections depuis l'ancien site, déclaration auprès de Google. Tous les accès vous sont remis." },
        { title: "Suivi", duration: "En continu", text: "Un point après le lancement, puis maintenance et évolutions à la demande. Vous restez propriétaire de tout." },
      ],
    },
  },
  {
    key: "about",
    label: "À propos",
    fields: [
      heroImageField,
      mediaField,
      { name: "title", label: "Titre", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      { name: "story", label: "Notre histoire (paragraphes séparés par une ligne vide)", type: "textarea" },
      {
        name: "values",
        label: "Valeurs",
        type: "list",
        itemFields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "text", label: "Texte", type: "textarea" },
        ],
      },
      {
        name: "commitments",
        label: "Engagements",
        type: "list",
        itemFields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "text", label: "Texte", type: "textarea" },
        ],
      },
    ],
    defaults: {
      media: [],
      title: "Une agence web à taille humaine, installée à Bordeaux.",
      intro: "QS2H accompagne les entreprises qui veulent un site à la hauteur de leur savoir-faire, sans passer par une grosse structure ni un modèle générique.",
      story:
        "QS2H est née d'un constat simple : beaucoup d'entreprises sérieuses ont un site qui ne leur ressemble pas. Trop lent, difficile à modifier, introuvable sur Google, ou construit sur un modèle utilisé par des milliers d'autres.\n\nNous avons donc choisi de faire l'inverse. Peu de projets à la fois, un interlocuteur unique, un design pensé pour chaque métier et un code que nous savons expliquer.\n\nBasés à Bordeaux, nous travaillons avec des clients de toute la France, à distance ou sur place selon le projet.",
      values: [
        { title: "Clarté", text: "Un devis lisible, des délais tenus, un langage sans jargon." },
        { title: "Exigence", text: "Chaque détail compte : espacements, vitesse, accessibilité, textes." },
        { title: "Durabilité", text: "Des sites simples à maintenir, qui vieillissent bien." },
      ],
      commitments: [
        { title: "Délais annoncés, délais tenus", text: "La date de livraison figure dans le devis. Si nous la dépassons de notre fait, nous le disons et nous compensons." },
        { title: "Vous êtes propriétaire", text: "Nom de domaine, code, contenus et accès : tout vous est remis à la livraison, sans frais cachés." },
        { title: "Transparence des prix", text: "Prix fixe, périmètre écrit, options chiffrées. Pas de surprise en fin de projet." },
      ],
    },
  },
  {
    key: "chatbot",
    label: "Assistant (chatbot)",
    fields: [
      { name: "enabled", label: "Activer l'assistant sur le site (oui / non)", type: "text" },
      { name: "name", label: "Nom affiché", type: "text" },
      { name: "welcome", label: "Message d'accueil", type: "textarea" },
      { name: "fallback", label: "Réponse quand l'assistant ne sait pas", type: "textarea" },
      {
        name: "qa",
        label: "Réponses sur mesure (prioritaires)",
        type: "list",
        itemFields: [
          { name: "keywords", label: "Mots-clés déclencheurs, séparés par des virgules", type: "text" },
          { name: "answer", label: "Réponse", type: "textarea" },
        ],
      },
    ],
    defaults: {
      enabled: "oui",
      name: "Assistant QS2H",
      welcome: "Bonjour, je suis l'assistant de QS2H. Je peux vous renseigner sur nos services, nos tarifs et nos délais, ou transmettre votre demande à l'équipe. Que souhaitez-vous savoir ?",
      fallback: "Je n'ai pas la réponse précise à cette question. Je peux transmettre votre message à l'équipe, qui vous répond sous 24 heures ouvrées.",
      qa: [],
    },
  },
  {
    key: "services",
    label: "Page Services (visuels)",
    fields: [heroImageField, mediaField],
    defaults: { media: [] },
  },
  {
    key: "catalogue",
    label: "Page Catalogue (visuels)",
    fields: [heroImageField, mediaField],
    defaults: { media: [] },
  },
  {
    key: "pricing",
    label: "Page Tarifs (visuels)",
    fields: [heroImageField, mediaField],
    defaults: { media: [] },
  },
];

export const pageDefaults = Object.fromEntries(pageSchemas.map((p) => [p.key, p.defaults])) as Record<string, Record<string, unknown>>;

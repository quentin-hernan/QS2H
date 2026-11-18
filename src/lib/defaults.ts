/** Valeurs par défaut du site. Tout est surchargeable depuis /admin (Paramètres, Pages et textes). */

export type Company = typeof defaultSettings.company;
export type SiteSettings = typeof defaultSettings;

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
  footerText: "Sites web sur mesure pour les entreprises. Conçus à Bordeaux, livrés partout en France.",
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
      { name: "servicesTitle", label: "Titre de la section services", type: "text" },
      { name: "servicesLead", label: "Introduction des services", type: "textarea" },
      { name: "servicesBg", label: "Image ou vidéo de fond de « Ce que nous construisons » (facultatif)", type: "media" },
      { name: "projectsTitle", label: "Titre de la section réalisations", type: "text" },
      { name: "ctaTitle", label: "Titre de l'appel final", type: "text" },
      { name: "ctaText", label: "Texte de l'appel final", type: "textarea" },
    ],
    defaults: {
      media: [],
      kicker: "Création de sites web · Bordeaux et toute la France",
      line1: "Des sites qui",
      line2: "travaillent",
      line3: "pour vous.",
      lead: "QS2H conçoit des sites vitrines, sur mesure et e-commerce pour les TPE, PME et indépendants. Un design soigné, un chargement rapide, un bon référencement : votre site devient un outil qui amène des clients.",
      ctaPrimary: "Demander un devis",
      ctaSecondary: "Voir nos réalisations",
      layers: [
        { title: "Design", text: "Une identité visuelle qui inspire confiance dès la première seconde. La maquette est validée avec vous avant la moindre ligne de code." },
        { title: "Contenu", text: "Des textes écrits pour vos clients, pas pour les robots. Chaque page répond à une question précise que vos prospects se posent." },
        { title: "Code", text: "Un code propre, sans extension superflue. Il se charge vite, se modifie facilement et vous appartient entièrement." },
        { title: "Référencement", text: "Structure, balises, données structurées, fiche Google : les bases pour apparaître quand on cherche votre métier près de chez vous." },
        { title: "Performance", text: "Images optimisées, chargement différé, mobile d'abord. Un site rapide est mieux classé et fait plus de demandes de contact." },
      ],
      servicesBg: "",
      servicesTitle: "Ce que nous construisons",
      servicesLead: "Six services, une même exigence : un site que vous êtes fier de montrer et qui sert votre activité.",
      projectsTitle: "Réalisations",
      ctaTitle: "Parlons de votre site.",
      ctaText: "Décrivez votre activité en quelques lignes. Vous recevez une estimation chiffrée sous 24 heures ouvrées, sans engagement.",
    },
  },
  {
    key: "method",
    label: "Méthode",
    fields: [
      mediaField,
      { name: "title", label: "Titre", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      {
        name: "steps",
        label: "Étapes",
        type: "list",
        itemFields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "duration", label: "Durée indicative", type: "text" },
          { name: "text", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
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
    fields: [mediaField],
    defaults: { media: [] },
  },
  {
    key: "catalogue",
    label: "Page Catalogue (visuels)",
    fields: [mediaField],
    defaults: { media: [] },
  },
  {
    key: "pricing",
    label: "Page Tarifs (visuels)",
    fields: [mediaField],
    defaults: { media: [] },
  },
];

export const pageDefaults = Object.fromEntries(pageSchemas.map((p) => [p.key, p.defaults])) as Record<string, Record<string, unknown>>;

/**
 * Jeu de données de démarrage. Idempotent : ne remplit que les tables vides.
 * Les réalisations et avis sont des EXEMPLES (isExample = true) à remplacer depuis /admin.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const J = (v: unknown) => JSON.stringify(v);

const services = [
  {
    slug: "site-vitrine",
    title: "Site vitrine",
    tagline: "Une présence professionnelle, rapide et rassurante, prête à recevoir vos premiers clients.",
    problem: "Votre activité mérite mieux qu'une page Facebook ou un site vieillissant. Aujourd'hui, un prospect vérifie votre site avant de vous appeler. S'il est lent, daté ou illisible sur téléphone, il appelle quelqu'un d'autre.",
    solution: "Nous concevons un site de 3 à 8 pages, dessiné pour votre métier : une page d'accueil qui explique en quelques secondes ce que vous faites, des pages de services claires, vos réalisations, et un formulaire de contact qui fonctionne. Le tout adapté au mobile, rapide, et prêt à être trouvé sur Google.",
    deliverables: ["Design sur mesure validé avant développement", "3 à 8 pages rédigées avec vous", "Version mobile et tablette", "Formulaire de contact protégé contre le spam", "Référencement de base et fiche Google", "Formation de 1 heure à la modification des contenus"],
    duration: "3 à 4 semaines",
    priceFrom: 990,
    faq: [
      { q: "Combien de pages comprend un site vitrine ?", a: "Entre 3 et 8 pages selon la formule : accueil, présentation, services, réalisations, contact, et éventuellement un blog ou des mentions complémentaires." },
      { q: "Puis-je modifier le site moi-même ?", a: "Oui. Les textes, images et réalisations se modifient depuis une interface simple. Une formation d'une heure est incluse." },
      { q: "Le nom de domaine est-il inclus ?", a: "Nous vous aidons à le réserver à votre nom. Il reste votre propriété, avec un coût annuel d'environ 10 à 15 € payé directement au registrar." },
    ],
    seoTitle: "Création de site vitrine à La Rochelle et partout en France | QS2H",
    seoDescription: "Site vitrine sur mesure pour TPE, PME et indépendants : design soigné, rapide, adapté au mobile et référencé. Devis gratuit sous 24 h ouvrées.",
  },
  {
    slug: "site-sur-mesure",
    title: "Site sur mesure et application web",
    tagline: "Quand un modèle ne suffit plus : espace client, calculateur, réservation, outil métier.",
    problem: "Certaines activités ont des besoins qu'un site classique ne couvre pas : prise de rendez-vous complexe, espace réservé aux clients, devis en ligne, import de données. Les extensions empilées finissent par ralentir et fragiliser l'ensemble.",
    solution: "Nous partons de votre fonctionnement réel et développons exactement ce qu'il faut, avec une base de données et une interface d'administration que vous maîtrisez. Le code est documenté, testé, et vous est remis.",
    deliverables: ["Cahier des charges rédigé avec vous", "Interface d'administration dédiée", "Authentification sécurisée", "Intégrations (paiement, agenda, emailing, comptabilité)", "Tests automatisés sur les parcours critiques", "Documentation technique"],
    duration: "6 à 12 semaines",
    priceFrom: 4900,
    faq: [
      { q: "Comment est établi le prix ?", a: "Après un atelier de cadrage, nous chiffrons chaque fonctionnalité. Le prix final est fixe et écrit dans le devis." },
      { q: "Qui héberge l'application ?", a: "Nous l'installons sur un hébergement à votre nom. Nous pouvons aussi assurer l'exploitation dans le cadre d'un contrat de maintenance." },
    ],
    seoTitle: "Développement de site sur mesure et application web | QS2H",
    seoDescription: "Espace client, réservation, outil métier : QS2H développe des sites et applications web sur mesure, sécurisés et documentés. Devis gratuit.",
  },
  {
    slug: "refonte-de-site",
    title: "Refonte de site internet",
    tagline: "Moderniser votre site sans perdre votre référencement ni vos habitudes.",
    problem: "Votre site fonctionne encore, mais il est lent, ne s'affiche pas bien sur téléphone, ou donne une image qui ne correspond plus à votre entreprise. Le refaire à la légère peut aussi faire chuter votre visibilité sur Google.",
    solution: "Nous auditons l'existant, conservons ce qui fonctionne, redessinons le reste et mettons en place les redirections nécessaires pour que vos pages bien classées gardent leur position après la mise en ligne.",
    deliverables: ["Audit du site actuel (technique, contenu, référencement)", "Nouveau design et nouvelle arborescence", "Migration des contenus utiles", "Redirections 301 pour préserver le référencement", "Suivi du positionnement pendant 3 mois"],
    duration: "4 à 6 semaines",
    priceFrom: 1490,
    faq: [
      { q: "Vais-je perdre mon référencement Google ?", a: "Non, si la migration est préparée. Nous cartographions chaque adresse existante et redirigeons proprement vers sa nouvelle page." },
      { q: "Peut-on conserver mon nom de domaine ?", a: "Oui, c'est même recommandé : il porte l'ancienneté de votre site aux yeux de Google." },
    ],
    seoTitle: "Refonte de site internet : moderniser sans perdre son référencement | QS2H",
    seoDescription: "Refonte de site web avec audit, nouveau design et redirections 301 pour conserver votre positionnement Google. Agence à La Rochelle, clients partout en France.",
  },
  {
    slug: "e-commerce",
    title: "Boutique en ligne",
    tagline: "Un catalogue clair, un paiement sécurisé, une gestion des commandes simple.",
    problem: "Vendre en ligne ne se résume pas à afficher des produits. Frais de livraison, TVA, stocks, retours, confiance au moment de payer : chaque détail influence le taux de commande.",
    solution: "Nous construisons une boutique adaptée à la taille de votre catalogue : fiches produits soignées, parcours de commande court, paiement par carte sécurisé, emails de confirmation, et un tableau de bord pour suivre vos ventes.",
    deliverables: ["Boutique jusqu'à 100 produits à la livraison", "Paiement par carte et portefeuilles mobiles", "Calcul des frais de livraison et de la TVA", "Emails transactionnels aux couleurs de votre marque", "Pages légales de vente en ligne (CGV, rétractation)", "Formation à la gestion des produits et commandes"],
    duration: "5 à 8 semaines",
    priceFrom: 3200,
    faq: [
      { q: "Quels moyens de paiement sont acceptés ?", a: "Carte bancaire, Apple Pay, Google Pay et virement, via un prestataire de paiement certifié. Les données de carte ne transitent jamais par votre site." },
      { q: "Puis-je importer mes produits existants ?", a: "Oui, depuis un fichier tableur ou l'export de votre ancienne boutique." },
    ],
    seoTitle: "Création de boutique en ligne pour entreprises | QS2H",
    seoDescription: "Boutique e-commerce sur mesure : paiement sécurisé, gestion des stocks et des commandes, référencement produit. Devis gratuit sous 24 h.",
  },
  {
    slug: "referencement-seo",
    title: "Référencement SEO",
    tagline: "Être trouvé par les clients qui vous cherchent, à La Rochelle ou partout en France.",
    problem: "Un beau site que personne ne trouve ne sert à rien. Le référencement n'est ni de la magie ni un mot-clé glissé partout : c'est une suite de choix techniques et éditoriaux, mesurables.",
    solution: "Nous commençons par un audit : ce qui bloque, ce que font vos concurrents, ce que vos clients tapent réellement. Puis nous corrigeons la technique, optimisons vos pages, travaillons votre fiche Google et vos contenus, avec un rapport clair chaque mois.",
    deliverables: ["Audit technique et sémantique", "Optimisation des pages et des balises", "Données structurées (schema.org)", "Fiche Google Business Profile", "Plan éditorial et rédaction d'articles", "Rapport mensuel avec positions et visites"],
    duration: "Audit en 1 semaine, suivi mensuel",
    priceFrom: 450,
    faq: [
      { q: "En combien de temps voit-on des résultats ?", a: "Les corrections techniques produisent un effet en quelques semaines. Le gain de positions sur des requêtes concurrentielles demande généralement 3 à 6 mois." },
      { q: "Garantissez-vous la première place ?", a: "Non, et méfiez-vous de ceux qui le font. Nous nous engageons sur des actions précises et un suivi chiffré." },
    ],
    seoTitle: "Référencement SEO local et national à La Rochelle | QS2H",
    seoDescription: "Audit SEO, optimisation technique, fiche Google et contenus : améliorez votre visibilité locale et nationale avec un suivi mensuel chiffré.",
  },
  {
    slug: "maintenance-hebergement",
    title: "Maintenance et hébergement",
    tagline: "Votre site reste rapide, sécurisé et à jour, sans que vous y pensiez.",
    problem: "Un site non entretenu vieillit vite : failles de sécurité, pannes après une mise à jour, certificat expiré, sauvegarde inexistante le jour où l'on en a besoin.",
    solution: "Nous hébergeons votre site sur une infrastructure performante, surveillons sa disponibilité, appliquons les mises à jour, effectuons des sauvegardes quotidiennes et intervenons rapidement en cas d'incident.",
    deliverables: ["Hébergement performant avec HTTPS", "Sauvegardes quotidiennes conservées 30 jours", "Mises à jour de sécurité", "Surveillance de la disponibilité", "Modifications de contenu incluses (jusqu'à 2 h par mois)", "Support par email sous 1 jour ouvré"],
    duration: "Sans engagement de durée après 3 mois",
    priceFrom: 49,
    priceUnit: "€ HT / mois",
    faq: [
      { q: "Faut-il l'avoir fait créer chez vous ?", a: "Non, nous reprenons la maintenance de sites existants après un court audit." },
      { q: "Que se passe-t-il si le site tombe ?", a: "Nous sommes alertés immédiatement, intervenons en priorité et vous tenons informé jusqu'au retour à la normale." },
    ],
    seoTitle: "Maintenance et hébergement de site web | QS2H",
    seoDescription: "Hébergement, sauvegardes, mises à jour et surveillance : confiez la maintenance de votre site à QS2H à partir de 49 € HT par mois.",
  },
];

const CAPTIONS: Record<string, string> = {
  nav: "Navigation : accès aux pages clés et appel à l'action toujours visible.",
  hero: "Section d'accueil : la promesse et l'action principale, lisibles dès l'arrivée.",
  section: "Section de contenu : une idée par bloc, hiérarchie claire.",
  footer: "Pied de page : coordonnées, navigation secondaire et mentions légales.",
  mobile: "Version mobile : la même hiérarchie, pensée pour le pouce.",
  tablet: "Version tablette : la mise en page s'adapte à la largeur.",
};
const conceptPlanes = JSON.parse(fs.readFileSync(path.join(__dirname, "concept-planes.json"), "utf8")) as Record<string, { planes: { kind: string; caption: string }[]; meta: unknown }>;

// Projets CONCEPT : réalisés par QS2H pour illustrer la vue éclatée. Aucun client, aucun chiffre, aucun témoignage.
const projects = [
  {
    slug: "atelier-bois", title: "Atelier Bois — concept", client: "Projet concept QS2H", sector: "Artisan", services: ["site-vitrine", "referencement-seo"],
    summary: "Concept de site vitrine pour un menuisier : réalisations en galerie, savoir-faire détaillé, demande de devis guidée.",
    challenge: "Montrer un travail manuel par l'image, donner confiance avant le premier appel et faciliter la demande de devis.",
    solution: "Une page d'accueil qui annonce le métier en une phrase, des services expliqués simplement, un parcours du croquis à la pose et un appel à l'action répété sans insistance.",
    technologies: ["Next.js", "Tailwind CSS"], cover: "/seed/atelier-bois.webp",
  },
  {
    slug: "table-du-quai", title: "La Table du Quai — concept", client: "Projet concept QS2H", sector: "Restaurant", services: ["site-vitrine"],
    summary: "Concept de site pour une brasserie : carte modifiable par l'équipe, horaires clairs, réservation en trois clics.",
    challenge: "Une carte qui change chaque semaine, des appels pendant le service et un site qui reste figé.",
    solution: "Une carte éditable depuis un téléphone, des horaires et un accès toujours visibles, un bouton de réservation en haut de chaque page.",
    technologies: ["Next.js", "PostgreSQL"], cover: "/seed/table-du-quai.webp",
  },
  {
    slug: "cabinet-conseil", title: "Cabinet Conseil — concept", client: "Projet concept QS2H", sector: "Cabinet", services: ["site-sur-mesure", "referencement-seo"],
    summary: "Concept de site pour un cabinet de conseil : expertises lisibles, honoraires annoncés, prise de rendez-vous.",
    challenge: "Rassurer des dirigeants qui comparent plusieurs cabinets en quelques minutes.",
    solution: "Pages d'expertise rédigées pour répondre aux vraies questions, transparence sur les honoraires, prise de rendez-vous intégrée.",
    technologies: ["Next.js", "Prisma"], cover: "/seed/cabinet-conseil.webp",
  },
];

const plans = [
  { name: "Essentiel", price: "990 €", priceNote: "HT", description: "Pour démarrer avec une présence soignée.", features: ["Jusqu'à 3 pages", "Design sur mesure", "Adapté mobile et tablette", "Formulaire de contact sécurisé", "Référencement de base", "Formation d'1 heure"], highlighted: false, cta: "Demander ce devis" },
  { name: "Professionnel", price: "2 490 €", priceNote: "HT", description: "Pour une image haut de gamme et un site qui convertit.", features: ["Jusqu'à 8 pages", "Animations et éléments 3D", "Référencement local avancé", "Blog et statistiques de visites", "Rédaction accompagnée", "3 mois de maintenance offerts"], highlighted: true, cta: "Demander ce devis" },
  { name: "Sur mesure", price: "Sur devis", priceNote: "", description: "Pour les projets avec des besoins spécifiques.", features: ["Boutique en ligne", "Espace client et outils métier", "Intégrations spécifiques", "Interface d'administration dédiée", "Accompagnement dédié"], highlighted: false, cta: "Nous contacter" },
];
const options = [
  { name: "Maintenance et hébergement", price: "49 € HT / mois", description: "Sauvegardes, mises à jour, surveillance, 2 h de modifications par mois." },
  { name: "Rédaction des contenus", price: "90 € HT / page", description: "Textes rédigés à partir d'un entretien, orientés clients et référencement." },
  { name: "Photographies professionnelles", price: "dès 290 € HT", description: "Demi-journée de prises de vue sur site (La Rochelle et alentours)." },
  { name: "Pack référencement local", price: "450 € HT", description: "Audit, fiche Google, citations locales, premier rapport de positions." },
];

const faqs = [
  { question: "Combien coûte la création d'un site web ?", answer: "Un site vitrine démarre à 990 € HT, un site professionnel avec animations et référencement local à 2 490 € HT. Les projets sur mesure (boutique, espace client) sont chiffrés après un échange. Le prix est fixe et signé avant le démarrage." },
  { question: "Combien de temps faut-il pour avoir mon site ?", answer: "En moyenne 3 à 4 semaines pour un site vitrine, 5 à 8 pour une boutique en ligne. Le délai exact figure dans le devis. Il dépend aussi de la rapidité avec laquelle vous nous transmettez vos contenus." },
  { question: "Le site m'appartient-il ?", answer: "Oui, entièrement. À la livraison, nous vous remettons le code, les contenus, les accès à l'hébergement et au nom de domaine. Vous pouvez à tout moment confier le site à quelqu'un d'autre." },
  { question: "Pourrai-je modifier mon site moi-même ?", answer: "Oui. Les textes, images, prix et réalisations se modifient depuis une interface simple. Nous vous formons lors de la livraison, et nous restons disponibles en cas de besoin." },
  { question: "Travaillez-vous uniquement à La Rochelle ?", answer: "Non. Nous sommes installés à La Rochelle et pouvons nous déplacer en Charente-Maritime, mais la grande majorité des projets se déroulent à distance, avec des points en visioconférence." },
  { question: "Comment se passe le paiement ?", answer: "En deux fois pour les projets standard : 40 % à la signature du devis, le solde à la livraison. Pour les projets plus longs, un échéancier par étape est prévu dans le devis." },
  { question: "Mon site sera-t-il visible sur Google ?", answer: "Il sera conçu pour l'être : structure, vitesse, balises, données structurées, fiche Google. Personne ne peut honnêtement garantir une position, mais nous mesurons et rendons compte des résultats." },
  { question: "Que se passe-t-il après la mise en ligne ?", answer: "Nous faisons un point un mois après le lancement. Vous pouvez ensuite souscrire une maintenance mensuelle, ou nous solliciter ponctuellement pour des évolutions." },
];

const posts = [
  {
    slug: "combien-coute-un-site-web-entreprise",
    title: "Combien coûte un site web pour une entreprise ?",
    excerpt: "Entre 500 et 15 000 €, l'écart est énorme. Voici ce qui explique les différences de prix, et comment lire un devis.",
    category: "Budget", author: "QS2H", publishedAt: new Date("2026-10-06T08:00:00Z"),
    seoTitle: "Combien coûte un site web pour une entreprise en 2026 ?", seoDescription: "Prix d'un site vitrine, d'une boutique ou d'un site sur mesure : ce qui fait varier le tarif et comment comparer deux devis.",
    content: `<p>Demandez trois devis pour « un site web » et vous obtiendrez trois prix très différents. Ce n'est pas forcément que l'un d'eux se trompe : on compare rarement la même chose.</p>
<h2>Ce que contient le prix</h2>
<p>Le tarif d'un site dépend de quatre éléments principaux : le <strong>design</strong> (modèle adapté ou création sur mesure), le <strong>nombre de pages</strong>, les <strong>fonctionnalités</strong> (formulaire simple, réservation, paiement) et le <strong>travail sur les contenus</strong> (rédaction, photos).</p>
<h2>Les fourchettes que nous observons</h2>
<ul>
<li><strong>Site vitrine de 3 à 5 pages :</strong> de 900 à 2 500 € HT.</li>
<li><strong>Site vitrine soigné avec animations et référencement :</strong> de 2 500 à 5 000 € HT.</li>
<li><strong>Boutique en ligne :</strong> de 3 000 à 10 000 € HT selon le catalogue.</li>
<li><strong>Application ou espace client sur mesure :</strong> à partir de 5 000 € HT.</li>
</ul>
<h2>Les coûts qu'on oublie</h2>
<p>Au-delà de la création, prévoyez le nom de domaine (environ 10 à 15 € par an), l'hébergement, et si vous le souhaitez une maintenance. Un site sans entretien finit par poser problème : failles de sécurité, mises à jour oubliées, pannes.</p>
<h2>Comment comparer deux devis</h2>
<p>Vérifiez que chaque devis précise le nombre de pages, la propriété du code et des contenus, le nombre d'allers-retours sur la maquette, ce qui est inclus pour le référencement, et la date de livraison. Un prix très bas cache souvent un site construit sur un modèle générique, sans accompagnement.</p>
<h2>Notre conseil</h2>
<p>Partez de votre objectif : combien de demandes de contact voulez-vous recevoir par mois ? Un site qui apporte deux clients de plus par mois se rembourse vite, même à 2 500 €.</p>`,
  },
  {
    slug: "site-vitrine-ou-sur-mesure",
    title: "Site vitrine ou site sur mesure : comment choisir ?",
    excerpt: "Les deux termes sont souvent confondus. Ce qu'ils recouvrent, et les questions à se poser avant de décider.",
    category: "Conseils", author: "QS2H", publishedAt: new Date("2026-10-20T08:00:00Z"),
    seoTitle: "Site vitrine ou site sur mesure : lequel choisir pour son entreprise ?", seoDescription: "Différences, avantages et limites du site vitrine et du site sur mesure, avec les critères pour choisir selon votre activité.",
    content: `<p>« Vitrine » désigne ce que fait le site : présenter votre activité. « Sur mesure » désigne la façon dont il est fabriqué : sans modèle imposé. Les deux ne s'opposent donc pas, et on peut très bien avoir une vitrine sur mesure.</p>
<h2>Le site vitrine</h2>
<p>Il présente votre entreprise, vos services, vos références et permet de vous contacter. Pour la plupart des artisans, commerçants et professions libérales, c'est ce qu'il faut. Rapide à mettre en œuvre, il se maintient facilement.</p>
<h2>Le site sur mesure</h2>
<p>On parle de sur mesure lorsque le site a des fonctions propres à votre activité : espace réservé aux clients, simulateur de prix, import de données, réservation avec règles complexes. Le développement est plus long et plus cher, mais il évite d'empiler des extensions qui ralentissent le site.</p>
<h2>Cinq questions pour décider</h2>
<ol>
<li>Vos clients ont-ils besoin de se connecter à un espace personnel ?</li>
<li>Devez-vous calculer un prix ou une disponibilité en temps réel ?</li>
<li>Le site doit-il échanger des données avec un autre outil (comptabilité, stock, planning) ?</li>
<li>Avez-vous une identité visuelle forte à traduire fidèlement ?</li>
<li>Le site évoluera-t-il beaucoup dans les deux prochaines années ?</li>
</ol>
<p>Si vous répondez non aux trois premières questions, un site vitrine bien conçu suffit largement. Dans le doute, commencez simple : un site bien construit peut évoluer.</p>`,
  },
  {
    slug: "referencement-local-la-rochelle",
    title: "Référencement local à La Rochelle : six actions qui comptent",
    excerpt: "Fiche Google, pages locales, avis, cohérence des informations : par où commencer pour apparaître auprès des clients proches.",
    category: "SEO", author: "QS2H", publishedAt: new Date("2026-11-04T08:00:00Z"),
    seoTitle: "Référencement local à La Rochelle : 6 actions pour apparaître sur Google", seoDescription: "Fiche Google, pages locales, avis clients, cohérence NAP : les six actions de référencement local qui comptent vraiment pour une entreprise à La Rochelle.",
    content: `<p>Quand quelqu'un tape « plombier La Rochelle » ou « avocat Vieux-Port », Google affiche d'abord une carte avec quelques adresses, puis les résultats classiques. Apparaître dans cette carte change beaucoup de choses pour une entreprise locale.</p>
<h2>1. Compléter votre fiche Google</h2>
<p>Catégorie principale, horaires, zone de service, description, photos, services proposés. Une fiche complète est mieux classée et rassure.</p>
<h2>2. Recueillir des avis</h2>
<p>Demandez un avis à chaque client satisfait, en leur envoyant le lien direct. Répondez à tous, y compris aux avis négatifs, calmement.</p>
<h2>3. Garder des informations identiques partout</h2>
<p>Nom, adresse et téléphone doivent être écrits de la même façon sur votre site, votre fiche Google, les annuaires et vos réseaux. Les différences brouillent les signaux.</p>
<h2>4. Créer des pages locales utiles</h2>
<p>Une page par service, et si vous intervenez dans plusieurs communes, une page par zone avec du contenu réel : réalisations locales, spécificités, questions fréquentes. Évitez de dupliquer le même texte en changeant le nom de la ville.</p>
<h2>5. Soigner la technique</h2>
<p>Site rapide sur mobile, balises claires, données structurées de type « entreprise locale », adresse et horaires lisibles en HTML. C'est la base sur laquelle le reste s'appuie.</p>
<h2>6. Obtenir des liens locaux</h2>
<p>Chambre de commerce, associations d'entreprises, partenaires, presse locale : quelques liens de qualité valent mieux que des dizaines d'annuaires.</p>
<p>Ces actions demandent de la régularité plus que de gros moyens. Mesurez-les avec la Search Console et votre fiche Google, qui indiquent les recherches et les appels générés.</p>`,
  },
];

async function main() {
  if ((await db.service.count()) === 0) {
    for (const [i, s] of services.entries())
      await db.service.create({ data: { ...s, deliverables: J(s.deliverables), faq: J(s.faq), priceUnit: s.priceUnit ?? "€ HT", order: i } });
    console.log("✓ services");
  }
  if ((await db.project.count()) === 0) {
    for (const [i, p] of projects.entries()) {
      const cp = conceptPlanes[p.slug];
      const planes = cp.planes.map((x) => ({ ...x, caption: CAPTIONS[x.kind] ?? "" }));
      await db.project.create({ data: { ...p, services: J(p.services), results: J([]), technologies: J(p.technologies), images: J([p.cover]), planes: J(planes), meta: J(cp.meta), year: 2026, status: "published", isExample: true, authorized: false, order: i, seoTitle: `${p.title} — projet concept | QS2H`, seoDescription: p.summary } });
    }
    console.log("✓ 3 projets concept");
  }
  if ((await db.plan.count()) === 0) {
    for (const [i, p] of plans.entries()) await db.plan.create({ data: { ...p, features: J(p.features), order: i } });
    for (const [i, o] of options.entries()) await db.planOption.create({ data: { ...o, order: i } });
    console.log("✓ tarifs");
  }
  if ((await db.faq.count()) === 0) {
    for (const [i, f] of faqs.entries()) await db.faq.create({ data: { ...f, order: i } });
    console.log("✓ faq");
  }
  if ((await db.post.count()) === 0) {
    for (const p of posts) await db.post.create({ data: { ...p, status: "published" } });
    console.log("✓ articles");
  }
  if ((await db.teamMember.count()) === 0) {
    await db.teamMember.create({ data: { name: "[Prénom Nom]", role: "Fondateur · Direction créative et technique", bio: "Quinze lignes de présentation à remplacer depuis /admin > Équipe.", order: 0 } });
    console.log("✓ équipe (à compléter)");
  }
  if ((await db.user.count()) === 0) {
    const email = process.env.ADMIN_EMAIL;
    const pwd = process.env.ADMIN_PASSWORD;
    if (!email || !pwd) throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD sont requis pour créer le compte administrateur.");
    await db.user.create({ data: { email: email.toLowerCase(), name: "Administrateur", role: "owner", passwordHash: await hashPassword(pwd), mustChangePassword: true } });
    console.log(`✓ compte propriétaire créé : ${email} (mot de passe à changer à la première connexion)`);
  }
}

main().finally(() => db.$disconnect());

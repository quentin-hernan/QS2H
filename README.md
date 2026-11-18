# QS2H — site officiel

Site de l'agence **QS2H** (solutions digitales, La Rochelle) : site public avec ordinateur 3D et vue éclatée, boutique en ligne, espace client conforme RGPD, assistant QS2H (chatbot), back-office complet `/admin`, éditeur visuel des pages, SEO.

**Stack** : Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Prisma (SQLite en local, PostgreSQL en production) · Three.js / React Three Fiber · GSAP + Lenis · Zod · Tiptap · Playwright.

---

## 1. Démarrer en local

Prérequis : Node.js 20+.

```bash
npm install
cp .env.example .env        # puis éditer (voir §4)
npm run db:setup            # crée la base SQLite + données d'exemple + compte propriétaire
npm run dev                 # http://localhost:3000  (administration : /admin)
```

Le compte propriétaire est créé avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` du fichier `.env` ; le mot de passe est à changer à la première connexion.

| Commande | Rôle |
|---|---|
| `npm run build` / `npm start` | Build de production / serveur |
| `npm run typecheck` · `npm run lint` | Contrôles de types et de style |
| `npm run test:e2e` | Tests Playwright |
| `npm run db:push` | Applique `prisma/schema.prisma` à la base |
| `npm run db:seed` | Remplit les tables **vides** (idempotent) |
| `npm run assets` | Régénère les variantes du logo depuis `public/logo-original.png` |

Après une modification du schéma Prisma : arrêter `npm run dev`, lancer `npm run db:push`, relancer (sous Windows, le serveur verrouille le moteur Prisma).

## 2. Structure

```
src/app/(site)/          pages publiques : accueil, services, réalisations, boutique, catalogue, tarifs, méthode,
                         à propos, blog, faq, contact/devis, rendez-vous, pages libres, textes légaux
src/app/(site)/compte/   espace client (inscription, suivi de projet, demandes, messagerie, documents, factures, RGPD)
src/app/(site)/boutique/ boutique : liste, fiche article, panier, commande, confirmation
src/app/admin/           back-office (+ /admin/preview : aperçu des pages libres)
src/app/api/             devis, chat, rendez-vous, admin (upload, export…), compte
src/components/          UI publique ; scene/ = 3D ; shop/ = boutique ; admin/ = back-office
src/lib/                 db, auth, content (lecture en cache), chatbot, shop, legal, overrides, sections, seo, email…
prisma/                  schema.prisma + seed.ts (+ plans des réalisations d'exemple)
worker/                  worker de capture autonome (Docker) pour la capture de sites hors Vercel
scripts/                 logo, visuels d'exemple, purge des comptes inactifs, rappels de rendez-vous
public/models/           modèle 3D du portable (macbook.fbx) ; public/seed/ captures des réalisations d'exemple
docs/                    checklist de lancement, guide du back-office, plan éditorial
tests/e2e/               tests Playwright
```

## 3. Fonctionnalités

### Accueil
- **Hero** : titre qui apparaît mot à mot, ordinateur 3D (MacBook `public/models/macbook.fbx`) qui monte et s'ouvre, s'incline selon la souris. L'écran fait défiler des pages de sites entières puis passe au suivant en fondu. Fond sobre (`HeroBackdrop.tsx`, `app/hero-backdrop.css`) : voile de lumière, lignes fines, plaque de verre dépoli. Fichiers : `HomeStage.tsx`, `scene/StageCanvas.tsx`.
- **Écran de l'ordinateur** : Admin > Pages et textes > Accueil > « Écran du portable : sites affichés » (une capture de page entière par ligne). Vide = captures des réalisations. **Fond du hero** : image ou vidéo + voile, même page.
- **Sous le capot** (section épinglée) : les pages sortent de l'écran (5 couches), l'ordinateur part vers la gauche en fondu, puis la scène s'efface lentement.
- Ensuite : présentation, expertises, bloc « Visitez notre boutique » (articles du moment), démonstrations, « Pourquoi QS2H ? », appel final. Textes : Admin > Pages et textes > Accueil.
- Repli statique sans WebGL / appareil faible / `prefers-reduced-motion` ; rendu en pause hors écran ; pixel ratio plafonné à 2.

### Boutique (`/boutique`)
- Articles gérés dans **Admin > Boutique (articles)** : prix TTC, prix barré, stock (-1 = sur commande), pastille, image + galerie, **zones de présentation image + texte**, points forts, caractéristiques, « article du moment » (affiché sur l'accueil).
- Filtres, recherche, tri, ajout rapide au survol, panier (conservé dans le navigateur), fiche article avec données structurées Product.
- **Commande sans paiement en ligne** : coordonnées, livraison ou retrait à La Rochelle, acceptation obligatoire des **CGV boutique** (version enregistrée avec la commande). Prix et stock revérifiés côté serveur, stock décrémenté, email au client et à `MAIL_TO`. Suivi : **Admin > Commandes boutique** (statuts).
- **CGV boutique** (`/cgv-boutique`, modifiables et versionnées dans Admin > Textes légaux) : modèle à compléter (passages entre crochets) et **à faire valider par un juriste avant ouverture**.
- Le **Catalogue** (`/catalogue`, licences et produits sur devis) reste séparé : bouton « Demander ce produit » vers le formulaire de devis.

### Assistant QS2H (chatbot)
- Fenêtre de discussion flottante. Réponses tirées **uniquement des données du site** (rien d'inventé) : services, prix et délais, formules et options, FAQ, boutique (articles, prix, stock), commande, paiement, livraison, espace client, propriété du site, hébergement, maintenance, SEO, marketing, automatisation, méthode, engagements, RGPD, zone d'intervention, rendez-vous. Code : `src/lib/chatbot.ts`.
- Ordre : réponses sur mesure de l'admin (prioritaires) → salutations / contact / devis / rendez-vous → base de connaissances du site → prix → délais → services → FAQ → réponse par défaut.
- **Admin > Pages et textes > Assistant (chatbot)** : activer/désactiver, nom, message d'accueil, réponse par défaut, réponses sur mesure (mots-clés → réponse). **Admin > Assistant (conversations)** : historique.
- Sans clé : moteur à règles. Avec `ANTHROPIC_API_KEY` (et `CHATBOT_MODEL` facultatif), réponses rédigées par Claude, limitées à la même base de connaissances.
- Formulaire « laisser mes coordonnées » (consentement obligatoire) → Demandes reçues + email. Conversations conservées 90 jours (`scripts/purge-inactive.ts`), aucune IP stockée.

### Éditeur visuel « Modifier l'apparence » (toutes les pages)
Bouton visible uniquement pour un administrateur connecté (ou via Admin > Apparence des pages).
- **Sections** : fond (couleur, dégradé, image, vidéo, bandes), voile, animation du fond, animation d'apparition, thème, espacements, masquer.
- **Textes et images** : double-clic sur un texte pour le réécrire ; clic sur une image ou une vidéo pour la remplacer ; « Annuler mes modifications » remet la page d'origine (`src/lib/overrides.ts`). Les textes composés (mots en couleur, titres animés) se modifient dans Pages et textes.
- **Emplacements d'image** : photos d'équipe, pastilles d'avis, visuels des formules (`ImgSlot.tsx`).

### Autres
- **Réalisations** : plans par réalisation, visionneuse 3D éclatée, capture automatique depuis une URL (Playwright, protection SSRF), autorisation client obligatoire avant publication.
- **Services** : bloc « problème → solution » animé, glyphes propres à chaque service. **Contact/devis** : formulaire en 4 étapes, « Nous trouver » avec carte (La Rochelle).
- **À propos** : zone verticale modifiable (image ou vidéo de fond, voile, textes) à côté de « Notre histoire ».
- **Pages libres** : éditeur par sections avec aperçu réel ordinateur / tablette / mobile.
- **Rendez-vous** : créneaux réels, .ics, annulation, rappels (`scripts/send-reminders.ts`).
- **Thème clair / sombre** : suit le navigateur, bouton soleil / lune, choix mémorisé (`app/theme.css`).

## 4. Variables d'environnement

Voir `.env.example`.
- Obligatoires en production : `DATABASE_URL`, `AUTH_SECRET` (≥ 32 caractères aléatoires), `NEXT_PUBLIC_SITE_URL`.
- Emails : `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (devis, commandes, rendez-vous, messages).
- Facultatives : Turnstile (anti-spam), `CAPTURE_WORKER_URL` / `CAPTURE_WORKER_TOKEN` / `PSI_API_KEY` (capture des réalisations), `ANTHROPIC_API_KEY` / `CHATBOT_MODEL` (assistant), `ADMIN_REQUIRE_2FA`.

## 5. Mise en ligne (GitHub + Vercel + Neon)

1. **Base PostgreSQL** (Neon ou Supabase) ; dans `prisma/schema.prisma`, `provider = "postgresql"`.
2. Pousser le dépôt sur GitHub, l'importer dans Vercel, renseigner les variables (§4).
3. Depuis un terminal pointant sur la base de production : `npx prisma db push` puis `npm run db:seed`.
4. Domaine `qs2h.fr` dans Vercel, puis `NEXT_PUBLIC_SITE_URL=https://qs2h.fr`.
5. **Fichiers envoyés** : en local ils vont dans `public/uploads` et `storage/` (documents clients). Vercel est en lecture seule : brancher un stockage objet (Cloudflare R2 ou Supabase Storage) dans `src/app/api/admin/upload/route.ts`.
6. Resend : vérifier le domaine d'envoi. Search Console : soumettre `https://qs2h.fr/sitemap.xml`.
7. Limiteur de débit en mémoire : en multi-instances (Vercel), le remplacer par Upstash Redis (`src/lib/rate-limit.ts`).

Ne jamais committer `.env`, la base locale (`prisma/*.db`), `public/uploads/` ni `storage/` (déjà dans `.gitignore`).

## 6. Sécurité

- Sessions JWT signées dans un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production (admin 8 h, client 7 jours, clés distinctes, « se déconnecter partout »).
- Mots de passe **argon2id**, contrôle contre les fuites connues, jetons à usage unique hashés en base. 2FA TOTP (imposable avec `ADMIN_REQUIRE_2FA=true`).
- Anti brute-force admin : limite par IP + verrouillage après 5 échecs en 15 min, **actif en production** (désactivé en développement local uniquement, voir `loginAction` dans `src/app/admin/actions.ts`).
- Server Actions (CSRF natif), `middleware` sur `/admin`, validation Zod client et serveur, HTML assaini, CSV protégé.
- En-têtes : CSP, HSTS, X-Frame-Options (seul `/admin/preview` est affichable en cadre, par le site lui-même), nosniff, Referrer-Policy, Permissions-Policy. Journal d'audit (`AuditLog`).

## 7. Espace client et RGPD

- Inscription avec accès **immédiat** ; l'adresse email peut être confirmée plus tard (rappel dans l'espace, renvoi du lien). Consentements prouvés (date, version, IP tronquée), newsletter en double opt-in.
- Suivi de projet, demandes de modification, messagerie, documents (hors dossier public), devis et factures, rendez-vous.
- « Mes données et mes droits » : export, rectification, retrait de consentement, suppression (factures conservées 10 ans). Comptes inactifs : `scripts/purge-inactive.ts` (quotidien).
- Textes légaux versionnés (mentions, confidentialité, CGU, CGV prestations, **CGV boutique**, cookies).

## 8. Avant le lancement

Voir `docs/CHECKLIST-LANCEMENT.md`. En particulier :
- Admin > Paramètres entreprise : SIREN, adresse, téléphone, médiateur… (alimentent mentions légales, CGV et données structurées).
- Remplacer les contenus d'exemple : équipe (« [Prénom Nom] »), réalisations « concept », articles de boutique « Exemple », avis.
- Compléter et faire valider les **CGV boutique** avant d'accepter des commandes.

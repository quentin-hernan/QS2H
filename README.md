# QS2H — site officiel

Site de l'agence de création de sites web **QS2H** (Bordeaux) : site public avec expérience 3D et vue éclatée par réalisation, espace client conforme RGPD, back-office `/admin`, SEO complet.

**Stack** : Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Prisma · Three.js / React Three Fiber · GSAP + Lenis · Zod + React Hook Form · Tiptap · Playwright.

---

## 1. Démarrer en local

Prérequis : Node.js 20+.

```bash
npm install
cp .env.example .env        # puis éditer (voir §3)
npm run db:setup            # crée la base SQLite + jeu de données + compte propriétaire
npm run dev                 # http://localhost:3000
```

Le compte propriétaire est créé avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` du fichier `.env`. **Le mot de passe doit être changé à la première connexion** (l'administration l'impose).

Scripts utiles :

| Commande | Rôle |
|---|---|
| `npm run build` / `npm start` | Build de production / serveur |
| `npm run typecheck` · `npm run lint` | Contrôles de types et de style |
| `npm run test:e2e` | Tests Playwright (devis, admin, pages publiques, mobile) |
| `npm run db:seed` | Remplit les tables **vides** (idempotent) |
| `npm run assets` | Régénère les variantes du logo depuis `public/logo-original.png` |

## 2. Structure

```
src/app/(site)/          pages publiques (accueil, services, réalisations, tarifs, méthode, à propos, blog, faq, contact, légales, 404)
src/app/admin/           back-office (login, tableau de bord, ressources, demandes, pages, médiathèque, SEO, paramètres, utilisateurs, compte, sauvegarde)
src/app/(site)/compte/   espace client (inscription, vérification email, suivi, documents, messagerie, droits RGPD)
src/app/api/             /api/devis · /api/admin/* (upload, documents clients, export) · /api/compte/* (export, documents)
worker/                  worker de capture autonome (Docker) pour déployer la capture hors Vercel
src/components/          UI publique ; scene/ = 3D ; admin/ = UI du back-office
src/lib/                 db, auth (JWT + bcrypt), totp (2FA), seo (JSON-LD), content (lecture mise en cache), validators, legal, email
prisma/                  schema.prisma + seed.ts
tests/e2e/               tests Playwright
scripts/                 génération du logo, des visuels d'exemple
_prototype/              première maquette HTML (archive, ignorée par le build)
```

### Réalisations et vue éclatée
- Une réalisation = des **plans** (navigation, accueil, sections, pied de page, tablette, mobile). Un clic sur une réalisation ouvre la **visionneuse** (sans rechargement) : plans empilés en 3D, curseur *Assembler / Éclater*, rotation, zoom, légende au clic, plaques Référencement / Performance / Technologies, boutons *Visiter le site*, *Projet suivant*, *Fermer*. **Vue classique** = galerie simple, utilisée par défaut sans WebGL, sur appareil faible ou avec « réduire les animations ».
- Trois façons d'ajouter une réalisation (back-office) : **A** coller l'URL (capture Playwright : sections détectées par `header` / `section` / `footer`, tablette et mobile, métadonnées SEO, technologies détectées, scores PageSpeed Insights réels) ; **B** importer des images ; **C** créer les plans à la main. Protection SSRF : adresses privées, locales ou internes refusées avant la navigation **et** pour chaque requête du navigateur (`src/lib/ssrf.ts`).
- Aucune donnée inventée : scores et technologies viennent de la capture ; un projet client ne se publie qu'avec la case « J'ai l'autorisation du client » ; les projets réalisés sans client portent le badge « Projet concept ».
- Mode ZIP de site statique avec aperçu iframe isolé (`apercu.qs2h.fr`) : **non implémenté** (optionnel au cahier des charges).

### Identité et animation
- Palette : noir encre `#1C1C1C`, bleu QS2H `#2A5587` (survol `#1E4068`), bleu clair `#7FA9D9` pour les fonds sombres, fond `#F8F8F7`. Tout passe par des variables CSS (`--accent`, `--accent-hi`, `--accent-hover`) pilotées par Paramètres > Apparence ; `npx tsx --env-file=.env scripts/migrate-accent.ts` convertit un ancien accent bordeaux enregistré en base.
- Logo : `public/logo.png` (noir + bleu) et `logo-light.png` (ivoire + bleu clair) sont générés depuis `public/logo-original.png` par `npm run assets` (le bordeaux d'origine est recoloré en bleu). Pour utiliser le fichier officiel, remplacez `logo-original.png` puis relancez la commande.
- Typographie : Archivo (titres, graisses 700-800, axe de largeur) + Inter (texte), auto-hébergées via `next/font`. Aucune serif ni italique de titre.
- Animation (`src/components/Motion.tsx`, `src/app/motion.css`, `scenes.css`) : préchargeur à la première visite, transition de page (View Transitions API, repli en fondu), curseur contextuel, barre de progression, fond « atelier lumineux », cadres d'angle, texte vivant. Uniquement transform / opacité, 0,4 à 0,9 s, easing `cubic-bezier(0.22, 1, 0.36, 1)`, tout est réduit avec `prefers-reduced-motion`.
- Scènes par page (CSS 3D) : `Scenes.tsx` (services, tarifs, méthode, contact, blog, espace client) ; mode bureau des réalisations : `ProjectsDesk.tsx`.

### Scène 3D
- `components/HomeStage.tsx` : hero + section épinglée « vue éclatée » (GSAP ScrollTrigger).
- `components/scene/StageCanvas.tsx` : portable modélisé en code (aucun fichier .glb à charger), écran en texture temps réel alimentée par les **images de couverture des réalisations** du back-office, 5 couches détachables.
- `components/scene/GalleryCanvas.tsx` : galerie d'écrans suspendus (drag, flèches, relief, clic → page projet).
- Chargement **différé** après le premier rendu (le H1 est le LCP), **repli statique** (`public/hero-fallback.webp`) sans WebGL / appareil faible / `prefers-reduced-motion`, rendu **mis en pause** hors écran et onglet masqué, pixel ratio plafonné à 1,5 sur mobile.

## 3. Variables d'environnement

Voir `.env.example`. Obligatoires en production : `DATABASE_URL`, `AUTH_SECRET` (≥ 32 caractères aléatoires), `NEXT_PUBLIC_SITE_URL`.
Optionnelles : `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (emails de devis) ; `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (anti-spam Cloudflare).

## 4. Mise en ligne (Vercel + Neon)

1. **Base PostgreSQL** : créez un projet Neon (ou Supabase) et copiez l'URL de connexion.
2. Dans `prisma/schema.prisma`, remplacez `provider = "sqlite"` par `provider = "postgresql"`.
3. Poussez le dépôt sur GitHub, importez-le dans Vercel, renseignez les variables d'environnement (§3) avec l'URL Postgres.
4. Dans un terminal local pointant sur la base de production : `DATABASE_URL="postgresql://…" npx prisma db push` puis `npm run db:seed` (crée aussi le compte propriétaire).
5. Domaine : ajoutez `qs2h.fr` dans Vercel (HTTPS automatique), puis `NEXT_PUBLIC_SITE_URL=https://qs2h.fr`.
6. **Images** : en local elles sont écrites dans `public/uploads` (système de fichiers). Vercel étant en lecture seule, branchez un stockage objet (Cloudflare R2 ou Supabase Storage) : seule la fonction d'écriture de `src/app/api/admin/upload/route.ts` est à adapter (le reste du site ne manipule que des URLs).
7. Resend : vérifiez le domaine d'envoi, ajoutez `RESEND_API_KEY`.
8. Search Console : ajoutez la propriété, vérifiez par DNS, soumettez `https://qs2h.fr/sitemap.xml`.

## 5. Sécurité (déjà en place)

- Sessions JWT signées (HS256) dans un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production (admin 8 h, client 7 jours, clés distinctes, « se déconnecter partout »).
- Mots de passe hashés en **argon2id**, 12 caractères minimum, contrôle contre les fuites connues (Have I Been Pwned, k-anonymité), messages d'erreur génériques, jetons de vérification et de réinitialisation à usage unique et hashés en base.
- **2FA obligatoire pour le propriétaire** : tant qu'elle n'est pas activée, seule la page « Mon compte » est accessible.
- Anti brute-force : limite par IP (10 / 15 min) + verrouillage du compte après 5 échecs / 15 min, journal des connexions.
- **2FA TOTP** optionnelle (RFC 6238) activable depuis « Mon compte ».
- Protection CSRF native des Server Actions ; `middleware` protégeant tout `/admin` ; `X-Robots-Tag: noindex` sur l'administration.
- Validation **Zod côté client et serveur** ; HTML des articles assaini (liste blanche) à l'enregistrement et à l'affichage ; CSV protégé contre l'injection de formules.
- Formulaire de devis : honeypot, limite de débit (5 / h / IP), Cloudflare Turnstile si configuré.
- En-têtes : CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Journal d'audit des actions d'administration (table `AuditLog`).

> Limiteur de débit en mémoire : suffisant pour une instance. En multi-instances (Vercel serverless), remplacez `src/lib/rate-limit.ts` par Upstash Redis.

## 6. Espace client et conformité RGPD

- Inscription (cases CGU / confidentialité et majorité obligatoires et non précochées, newsletter facultative en **double opt-in**), vérification d'email obligatoire, preuves de consentement (date, version du document, IP tronquée).
- Espace : suivi de projet par étapes, documents (stockés **hors du dossier public**, servis à leur seul propriétaire), validation de maquettes, messagerie, journal des connexions.
- « Mes données et mes droits » : export JSON / CSV, rectification, retrait de consentement, **suppression** confirmée par email (les factures sont dissociées du compte et conservées 10 ans).
- Comptes inactifs : `npx tsx --env-file=.env scripts/purge-inactive.ts` (avertissement à 35 mois, suppression à 36 mois), à planifier une fois par jour.
- Textes légaux **versionnés** (back-office > Textes légaux) : chaque version est datée, les anciennes restent consultables (`?version=n`), un changement majeur prévient les clients par email.

## 7. Qualité mesurée

Lighthouse (mobile, throttling Lighthouse) sur la version de production locale : Accessibilité **100**, Bonnes pratiques **100**, SEO **100**, Performance **85–100** (accueil 85 avec la 3D, autres pages 90–100). LCP **observé** : 0,39 s sur l'accueil. CLS 0.

Tests Playwright : 61 tests (pages publiques desktop + mobile, vue éclatée, devis en 4 étapes, anti-spam, accès admin protégé avec 2FA, autorisation obligatoire avant publication d'un projet client, édition → mise à jour du site public, espace client : inscription, export, suppression avec conservation des factures).

## 8. À compléter avant lancement

Voir `docs/CHECKLIST-LANCEMENT.md`. Les identifiants légaux (SIREN, adresse, téléphone…) sont à saisir dans **/admin > Paramètres entreprise** : les mentions légales, la politique de confidentialité, les CGV et les données structurées s'en nourrissent.

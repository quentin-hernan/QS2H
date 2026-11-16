# Checklist avant lancement

## Légal et contenu
- [ ] **Paramètres entreprise** : forme juridique, capital, SIREN, SIRET, TVA, adresse, code postal, téléphone, directeur de la publication, médiateur de la consommation.
- [ ] Faire relire les **CGV**, la politique de confidentialité et les mentions légales (documents types générés depuis vos données) par un professionnel du droit.
- [ ] Remplacer les **3 projets concept** par de vraies réalisations (autorisation écrite du client, case cochée) ou les garder avec leur badge. Ne jamais publier de faux avis ni de résultats inventés.
- [ ] **Textes légaux** : relire et publier une version de chaque document (mentions, confidentialité, CGU, CGV, cookies), validée par un juriste.
- [ ] Compléter la fiche **Équipe** (nom, photo, présentation).
- [ ] Relire les textes de l'accueil, de la méthode et de « À propos » (Pages et textes).
- [ ] Vérifier les tarifs et options.
- [ ] Bandeau de confiance : ne garder que des chiffres réels.

## Technique
- [ ] `AUTH_SECRET` aléatoire (≥ 32 caractères), jamais le secret de développement.
- [ ] Base PostgreSQL de production + sauvegardes automatiques activées chez l'hébergeur.
- [ ] Mot de passe propriétaire changé, **2FA activée** (obligatoire).
- [ ] Capture des réalisations : Chromium disponible sur l'hébergeur, ou `worker/capture-server.ts` déployé avec `CAPTURE_WORKER_URL` / `CAPTURE_WORKER_TOKEN` ; `PSI_API_KEY` pour les scores Lighthouse.
- [ ] Dossier `storage/documents` (documents clients) sur un volume persistant et sauvegardé, ou stockage objet privé, jamais public.
- [ ] Tâche quotidienne `scripts/purge-inactive.ts` planifiée (comptes inactifs 3 ans).
- [ ] Procédure de notification de violation de données (CNIL, 72 h) rédigée.
- [ ] Registre des traitements à jour (devis, comptes clients, newsletter, statistiques).
- [ ] Stockage des images en production (R2 / Supabase) configuré.
- [ ] Domaine, HTTPS, `NEXT_PUBLIC_SITE_URL=https://qs2h.fr`.
- [ ] Resend : domaine d'envoi vérifié (SPF / DKIM), test d'envoi d'un devis (notification + confirmation reçues).
- [ ] Turnstile (anti-spam) configuré.
- [ ] `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:e2e` sans erreur.

## SEO
- [ ] Search Console : propriété vérifiée, sitemap soumis.
- [ ] Fiche Google Business Profile créée et reliée au site.
- [ ] Plausible : domaine renseigné (SEO et redirections > Suivi) ; vérifier les événements *Devis envoyé*, *Clic téléphone*, *Clic email* après consentement.
- [ ] Contrôle des données structurées (outil de test des résultats enrichis) : ProfessionalService, FAQPage, Service, Article, BreadcrumbList.
- [ ] Redirections 301 si un ancien site existe.
- [ ] Contrôler les titres et meta descriptions de chaque service, réalisation et article.

## Performance et accessibilité
- [ ] Lighthouse mobile sur l'accueil, un service, le contact, un article (cible > 90 hors 3D différée).
- [ ] Test sur un vrai téléphone moyen de gamme : scène 3D fluide ou repli statique propre.
- [ ] Test au clavier seul (lien d'évitement, menu, formulaire, FAQ) et avec lecteur d'écran.
- [ ] Test avec « Réduire les animations » activé : scène figée, aucune animation de défilement.

## Après la mise en ligne
- [ ] Soumettre un devis de test et vérifier le circuit complet (formulaire → demande dans /admin → emails).
- [ ] Publier les premiers articles du plan éditorial.
- [ ] Demander les premiers avis clients et les saisir (Avis clients).

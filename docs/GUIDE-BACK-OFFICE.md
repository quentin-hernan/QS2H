# Guide du back-office QS2H

Adresse : `https://qs2h.fr/admin` · Tout est en français, aucune ligne de code à toucher.

## Première connexion
1. Connectez-vous avec l'email et le mot de passe initiaux fournis.
2. Le site vous demande de **choisir un nouveau mot de passe** (12 caractères minimum, majuscules + minuscules + chiffres).
3. **Obligatoire pour le propriétaire** : Mon compte > Double authentification (Google Authenticator, 1Password, Authy…). Tant qu'elle n'est pas activée, seule la page « Mon compte » est accessible.

## Où modifier quoi ?

| Je veux… | Rubrique |
|---|---|
| Changer mon téléphone, mon adresse, mon SIREN, mes horaires | **Paramètres entreprise** (met à jour tout le site, les mentions légales et Google) |
| Changer la couleur d'accent | Paramètres entreprise > Apparence |
| Modifier les titres et textes de l'accueil, de la méthode, de « À propos » | **Pages et textes** (historique + restauration) |
| Ajouter / modifier une réalisation | **Réalisations** (la couverture alimente aussi l'écran 3D de l'accueil), voir « Ajouter une réalisation » |
| Modifier les textes légaux (mentions, CGU, CGV, confidentialité, cookies) | **Textes légaux** (versionnés) |
| Suivre un client, déposer un devis ou une facture, répondre à un message | **Clients** |
| Changer un prix, une formule, une option | **Tarifs** et **Options tarifaires** |
| Modifier un service, ses livrables, sa FAQ | **Services** |
| Ajouter un avis client | **Avis clients** |
| Écrire un article | **Blog** (éditeur riche, planification, aperçu) |
| Ajouter une personne à l'équipe | **Équipe** |
| Voir et suivre les demandes de devis | **Demandes reçues** (statuts, notes, export CSV) |
| Importer des images | **Médiathèque** (conversion WebP automatique, texte alternatif obligatoire) |
| Rediriger une ancienne adresse | **SEO et redirections** > Redirections |
| Connecter Plausible / Calendly | SEO et redirections > Suivi et services connectés |
| Inviter un collaborateur | **Utilisateurs** (rôle Propriétaire ou Éditeur) |
| Exporter toutes mes données | **Sauvegardes et export** |

## Ajouter une réalisation
Réalisations > Nouvelle réalisation. Remplissez le titre, le client, le secteur, la description, puis choisissez l'un des trois modes pour les **plans** de la vue éclatée :
- **A · Capturer depuis l'URL** : renseignez « URL du site » puis cliquez sur le bouton. Quelques dizaines de secondes plus tard, les plans (navigation, accueil, sections, pied de page, tablette, mobile) sont créés, avec le titre, les H1, les technologies détectées et les scores Lighthouse **mesurés**. Relisez les noms et les légendes (rôle de chaque section, vos choix de conception).
- **B · Importer des images** : sélectionnez plusieurs captures (PNG, JPEG, WebP) ; chacune devient un plan dont vous choisissez le type.
- **C · Plan manuel** : choisissez une image de la médiathèque, nommez-la, rédigez la légende.
Réordonnez avec « Vers le fond / Vers l'avant ». Un plan de type **Mobile** est placé devant, sur un téléphone.

**Avant de publier un projet client**, cochez « J'ai l'autorisation du client de présenter ce projet » et notez comment elle a été obtenue : sans elle, la publication est refusée. Un projet réalisé par vous-même sans client se marque **Projet concept** (badge visible). N'ajoutez des résultats chiffrés et un témoignage que s'ils sont réels.

## Clients et espace client
Les comptes apparaissent dans **Clients**. Sur une fiche : créez le **suivi de projet** (étapes À venir / En cours / Terminé, avec une note visible par le client), déposez un **document** (devis, facture, livrable, maquette ; PDF, PNG, JPEG ou ZIP, 15 Mo), répondez aux messages (le client est prévenu par email). Le client peut valider une maquette ou demander des modifications. Le propriétaire peut supprimer un compte (droit à l'effacement) : les factures sont conservées 10 ans, sans lien avec le compte.

## Textes légaux
**Textes légaux** : choisissez le document, modifiez le texte (pré-rempli depuis les paramètres entreprise), puis « Publier une nouvelle version ». Cochez « Changement majeur » pour prévenir par email les clients (CGU, confidentialité, CGV). Les anciennes versions restent consultables par les visiteurs. **Faites relire ces textes par un juriste avant la mise en ligne.**

## Publier
- Chaque enregistrement met à jour le site public **immédiatement**.
- Réalisations et articles ont un statut **Brouillon / Publié** (un brouillon est invisible). Un article « Publié » avec une date future apparaît à cette date.
- L'aperçu à droite du formulaire montre le rendu de la fiche avant publication.
- Un message de confirmation vert apparaît après chaque enregistrement. En cas d'erreur, le champ concerné est signalé en rouge.

## Remplacer les projets concept
Au démarrage, le site contient **3 projets concept** (badge « Projet concept », aucun client, aucun chiffre, aucun témoignage) et **aucun avis**. Supprimez-les quand vous avez de vraies réalisations. Avis clients : n'ajoutez que de vrais avis ; la section n'apparaît sur l'accueil, et la note n'est envoyée à Google, qu'à partir du premier vrai avis. Équipe : remplacez la fiche « [Prénom Nom] ».

## Demandes de devis
Chaque envoi du formulaire crée une demande (statut *nouveau*) et déclenche deux emails : notification à vous, confirmation au client. Faites avancer le statut : *contacté → devis envoyé → gagné / perdu*, et notez vos échanges. **Droit à l'effacement (RGPD)** : bouton « Supprimer » sur la fiche de la demande.

## Sécurité au quotidien
- Ne partagez jamais votre mot de passe : invitez plutôt un collaborateur depuis **Utilisateurs**.
- Après 5 échecs de connexion, le compte est verrouillé 15 minutes.
- Le journal des connexions est visible dans **Utilisateurs**.

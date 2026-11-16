import type { Company } from "./defaults";

export type LegalSection = { h: string; p: string[] };

const id = (c: Company) => `${c.legalName}, ${c.legalForm} au capital de ${c.capital}, SIREN ${c.siren}, SIRET ${c.siret}, TVA intracommunautaire ${c.tva}`;
const addr = (c: Company) => `${c.address}, ${c.zip} ${c.city}`;

export function mentionsLegales(c: Company): LegalSection[] {
  return [
    { h: "Éditeur du site", p: [`${id(c)}.`, `Siège social : ${addr(c)}.`, `Contact : ${c.email} · ${c.phone}.`, `Directeur de la publication : ${c.director}.`] },
    { h: "Hébergement", p: [`${c.hostName}, ${c.hostAddress}.`] },
    { h: "Propriété intellectuelle", p: ["L'ensemble des contenus de ce site (textes, images, logos, éléments graphiques, code) est la propriété de l'éditeur ou de ses partenaires et est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite."] },
    { h: "Responsabilité", p: ["L'éditeur s'efforce de fournir des informations exactes et à jour, sans pouvoir garantir l'absence totale d'erreur ou d'omission. Les liens vers des sites tiers sont fournis à titre d'information ; l'éditeur n'est pas responsable de leur contenu."] },
    { h: "Données personnelles", p: ["Le traitement de vos données personnelles est détaillé dans la politique de confidentialité accessible depuis le pied de page."] },
    { h: "Médiation de la consommation", p: [`Conformément au code de la consommation, le client consommateur peut recourir gratuitement au médiateur suivant : ${c.mediator}.`] },
  ];
}

export function confidentialite(c: Company): LegalSection[] {
  return [
    { h: "Responsable du traitement", p: [`${id(c)}. Siège : ${addr(c)}. Contact pour toute question relative aux données : ${c.dpoEmail}.`] },
    { h: "Données collectées et finalités", p: ["Formulaire de devis et de contact : nom, email, téléphone (facultatif), entreprise (facultatif), description du projet, budget et délai souhaités. Finalité : répondre à votre demande et vous adresser une proposition commerciale. Base légale : mesures précontractuelles prises à votre demande et votre consentement.", "Mesure d'audience : si vous l'acceptez, des statistiques de fréquentation anonymisées sont collectées pour améliorer le site. Base légale : consentement."] },
    { h: "Durée de conservation", p: ["Demandes de devis et de contact : 3 ans à compter du dernier échange. Clients : durée de la relation contractuelle puis durées légales de conservation comptable. Choix de consentement aux cookies : 6 mois."] },
    { h: "Destinataires", p: ["Les données sont destinées à QS2H. Elles sont traitées par des prestataires techniques agissant en tant que sous-traitants (hébergement, envoi d'emails, protection anti-spam) et ne sont jamais vendues."] },
    { h: "Transferts hors Union européenne", p: ["Certains prestataires peuvent traiter des données hors de l'Union européenne. Dans ce cas, des garanties appropriées (clauses contractuelles types de la Commission européenne) encadrent ces transferts."] },
    { h: "Vos droits", p: [`Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout moment et de définir des directives post-mortem. Pour les exercer : ${c.dpoEmail}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`] },
    { h: "Sécurité", p: ["Les échanges sont chiffrés (HTTPS), l'accès aux données est restreint et journalisé, et les formulaires sont protégés contre les abus."] },
  ];
}

export function cookies(): LegalSection[] {
  return [
    { h: "Qu'est-ce qu'un cookie ?", p: ["Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site. Certains sont indispensables, d'autres servent à mesurer l'audience."] },
    { h: "Cookies strictement nécessaires", p: ["Mémorisation de votre choix de consentement (stockage local du navigateur) et, pour les administrateurs, cookie de session sécurisé. Ils ne nécessitent pas de consentement."] },
    { h: "Mesure d'audience", p: ["Avec votre accord uniquement, nous utilisons un outil de mesure d'audience respectueux de la vie privée pour connaître les pages les plus consultées. Aucune publicité, aucun profilage."] },
    { h: "Gérer vos choix", p: ["Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de chaque page. Refuser est aussi simple qu'accepter, et n'affecte pas votre navigation."] },
    { h: "Services tiers chargés à votre demande", p: ["La carte (OpenStreetMap) et le module anti-spam ne se chargent qu'au moment où vous interagissez avec eux."] },
  ];
}

export function cgv(c: Company): LegalSection[] {
  return [
    { h: "1. Objet", p: [`Les présentes conditions générales de vente régissent les prestations de création, de refonte et de maintenance de sites web fournies par ${id(c)} (« le Prestataire ») à ses clients professionnels (« le Client »).`] },
    { h: "2. Devis et commande", p: ["Toute prestation fait l'objet d'un devis gratuit, valable 30 jours, précisant le périmètre, le prix fixe, le calendrier et les modalités de paiement. La commande est ferme à réception du devis signé et de l'acompte."] },
    { h: "3. Prix et paiement", p: ["Les prix sont exprimés en euros hors taxes. Sauf mention contraire au devis, le règlement s'effectue à hauteur de 40 % à la commande et 60 % à la livraison. Les factures sont payables à 30 jours. Tout retard entraîne des pénalités de retard égales à trois fois le taux d'intérêt légal ainsi qu'une indemnité forfaitaire de recouvrement de 40 €."] },
    { h: "4. Délais", p: ["Les délais indiqués au devis courent à compter de la réception de l'acompte et des éléments à fournir par le Client (textes, images, accès). Tout retard de transmission décale d'autant la livraison."] },
    { h: "5. Obligations du Client", p: ["Le Client fournit en temps utile les contenus et informations nécessaires, garantit détenir les droits sur les éléments transmis et valide les étapes dans les délais convenus."] },
    { h: "6. Recette et livraison", p: ["Le site est présenté sur une version de test. Le Client dispose de 10 jours ouvrés pour formuler ses observations. Passé ce délai, ou à la mise en ligne, la prestation est réputée acceptée, sous réserve de la correction des anomalies signalées."] },
    { h: "7. Propriété intellectuelle", p: ["À la livraison et après paiement intégral, le Client devient propriétaire du site, de son code spécifique et des contenus créés pour lui. Les composants libres ou tiers restent soumis à leur licence. Le Prestataire peut citer la réalisation dans ses références, sauf opposition écrite du Client."] },
    { h: "8. Garantie et responsabilité", p: ["Le Prestataire garantit la conformité du site au devis pendant 3 mois à compter de la livraison et corrige gratuitement les anomalies qui lui sont imputables. Sa responsabilité est limitée au montant du prix payé et ne couvre pas les dommages indirects."] },
    { h: "9. Maintenance", p: ["La maintenance fait l'objet d'un contrat distinct, mensuel, résiliable à tout moment avec un préavis de 30 jours après une période initiale de 3 mois."] },
    { h: "10. Résiliation", p: ["En cas de manquement grave non corrigé sous 15 jours après mise en demeure, l'autre partie peut résilier la commande. Les sommes correspondant au travail réalisé restent dues."] },
    { h: "11. Données personnelles", p: ["Chaque partie respecte la réglementation applicable en matière de protection des données (RGPD). Les traitements opérés pour le compte du Client font l'objet d'un accord de sous-traitance sur demande."] },
    { h: "12. Droit applicable et litiges", p: [`Les présentes CGV sont soumises au droit français. À défaut d'accord amiable, les tribunaux du ressort du siège du Prestataire sont compétents. Médiation : ${c.mediator}.`, "Document type à faire relire par un professionnel du droit avant mise en production."] },
  ];
}

export function cgu(c: Company): LegalSection[] {
  return [
    { h: "1. Objet", p: [`Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'usage de l'espace client du site de ${c.legalName} (« QS2H »). Créer un compte implique leur acceptation.`] },
    { h: "2. Accès au compte", p: ["L'espace client est réservé aux professionnels et aux personnes majeures. Vous vous engagez à fournir des informations exactes, à protéger votre mot de passe et à nous signaler tout usage non autorisé. L'adresse email doit être vérifiée pour activer le compte."] },
    { h: "3. Services proposés", p: ["Votre espace permet de suivre vos demandes de devis et l'avancement de vos projets, de consulter vos documents (devis, factures, livrables), de valider des maquettes et d'échanger avec QS2H."] },
    { h: "4. Vos données", p: ["Vous pouvez à tout moment exporter vos données, les rectifier ou supprimer votre compte depuis la page « Mes données et mes droits ». Les factures sont conservées 10 ans, comme la loi l'exige. Voir la politique de confidentialité."] },
    { h: "5. Disponibilité et responsabilité", p: ["QS2H s'efforce d'assurer l'accès continu à l'espace client, sans garantie d'absence d'interruption. L'accès peut être suspendu en cas d'usage frauduleux ou contraire aux présentes CGU."] },
    { h: "6. Évolution des CGU", p: ["Les CGU peuvent évoluer. Les versions précédentes restent consultables et vous êtes informé par email de tout changement important."] },
    { h: "7. Droit applicable", p: ["Les présentes CGU sont soumises au droit français. Document type à faire relire par un professionnel du droit avant mise en production."] },
  ];
}

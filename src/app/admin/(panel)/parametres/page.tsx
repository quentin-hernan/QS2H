import { getSettings } from "@/lib/content";
import { requireSession } from "@/lib/auth";
import { SettingsSection, TrustEditor } from "@/components/admin/Misc";

export const metadata = { title: "Paramètres entreprise" };

export default async function Settings() {
  await requireSession("owner");
  const s = await getSettings();
  return (
    <div className="space-y-8">
      <header><h1 className="mb-3 text-h2 font-medium">Paramètres de l&apos;entreprise</h1><p className="muted max-w-2xl">Une modification ici met à jour tout le site : en-tête, pied de page, pages légales, données structurées pour Google. Les champs entre crochets sont à compléter avant la mise en ligne.</p></header>
      <SettingsSection section="company" title="Identité et coordonnées" initial={s.company} fields={[
        { name: "name", label: "Nom commercial" }, { name: "tagline", label: "Signature" },
        { name: "legalName", label: "Raison sociale" }, { name: "legalForm", label: "Forme juridique", hint: "SASU, EI, SAS…" },
        { name: "capital", label: "Capital social" }, { name: "siren", label: "SIREN" }, { name: "siret", label: "SIRET" }, { name: "tva", label: "N° de TVA intracommunautaire" },
        { name: "address", label: "Adresse" }, { name: "zip", label: "Code postal" }, { name: "city", label: "Ville" },
        { name: "phone", label: "Téléphone" }, { name: "email", label: "Email de contact" }, { name: "hours", label: "Horaires" },
        { name: "area", label: "Zone d'intervention", type: "textarea" },
        { name: "director", label: "Directeur de la publication" }, { name: "mediator", label: "Médiateur de la consommation", type: "textarea" },
        { name: "hostName", label: "Hébergeur" }, { name: "hostAddress", label: "Adresse de l'hébergeur", type: "textarea" }, { name: "dpoEmail", label: "Email RGPD (droits d'accès, effacement)" },
      ]} />
      <SettingsSection section="theme" title="Apparence" initial={s.theme} fields={[{ name: "accent", label: "Couleur d'accent", type: "color", hint: "Utilisée pour boutons, liens actifs et détails. Une version plus claire est calculée automatiquement pour les fonds sombres. Vérifiez le contraste (texte ivoire sur cette couleur)." }]} />
      <SettingsSection section="social" title="Réseaux sociaux" initial={s.social} fields={[{ name: "linkedin", label: "LinkedIn", hint: "https://…" }, { name: "instagram", label: "Instagram" }, { name: "facebook", label: "Facebook" }]} />
      <SettingsSection section="footerText" title="Texte du pied de page" initial={{ footerText: s.footerText }} fields={[{ name: "footerText", label: "Texte", type: "textarea" }]} />
      <TrustEditor initial={s.trust} />
    </div>
  );
}

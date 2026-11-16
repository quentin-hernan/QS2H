import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { SettingsSection } from "@/components/admin/Misc";

export const metadata = { title: "SEO et redirections" };

export default async function Seo() {
  const [s, redirects] = await Promise.all([getSettings(), db.redirect.count()]);
  const ring = { borderColor: "rgb(242 239 233 / .14)" };
  return (
    <div className="space-y-8">
      <header><h1 className="mb-3 text-h2 font-medium">SEO et redirections</h1><p className="muted max-w-2xl">Le titre et la description de chaque page se règlent dans sa fiche (service, réalisation, article). Le sitemap, le fichier robots et les données structurées sont générés automatiquement.</p></header>
      <section className="grid gap-4 md:grid-cols-3">
        <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border p-6 hover:bg-white/5" style={ring}><span className="font-medium">sitemap.xml ↗</span><span className="muted mt-1 block text-sm">Mis à jour à chaque publication.</span></a>
        <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border p-6 hover:bg-white/5" style={ring}><span className="font-medium">robots.txt ↗</span><span className="muted mt-1 block text-sm">/admin et /api sont exclus.</span></a>
        <Link href="/admin/redirections" className="rounded-2xl border p-6 hover:bg-white/5" style={ring}><span className="font-medium">Redirections 301 →</span><span className="muted mt-1 block text-sm">{redirects} redirection(s) active(s).</span></Link>
      </section>
      <SettingsSection section="integrations" title="Suivi et services connectés" initial={s.integrations} fields={[
        { name: "plausibleDomain", label: "Domaine Plausible (mesure d'audience)", hint: "Ex. qs2h.fr. Le script ne se charge qu'avec le consentement du visiteur. Événements suivis : devis envoyé, clic téléphone, clic email." },
        { name: "calendlyUrl", label: "Lien de prise de rendez-vous (Calendly…)", hint: "https://calendly.com/… affiché sur la page Contact." },
        { name: "searchConsoleToken", label: "Jeton de vérification Google Search Console", hint: "Collez le contenu de la balise meta de vérification, ou vérifiez par DNS (recommandé)." },
      ]} />
    </div>
  );
}

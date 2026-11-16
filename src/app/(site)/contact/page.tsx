import { QuoteForm } from "@/components/QuoteForm";
import { MapEmbed } from "@/components/MapEmbed";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { isPlaceholder } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Contact et devis gratuit : création de site web à Bordeaux",
  description: "Demandez votre devis gratuit pour un site web : formulaire en quatre étapes, réponse sous 24 h ouvrées. Agence à Bordeaux, clients partout en France.",
  path: "/contact",
});

export default async function Contact({ searchParams }: { searchParams: Promise<{ formule?: string }> }) {
  const [{ formule }, s] = await Promise.all([searchParams, getSettings()]);
  const c = s.company;
  return (
    <section className="dark-section min-h-screen pb-24 pt-40 md:pt-48">
      <div className="container grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
          <p className="eyebrow mb-7">Devis gratuit</p>
          <h1 className="text-h1 font-medium">Parlons de <span className="serif-it">votre projet.</span></h1>
          <p className="muted mt-7 max-w-md text-[1.1rem] leading-relaxed">Quatre questions rapides. Vous recevez une estimation chiffrée sous 24 heures ouvrées, sans engagement.</p>
          <dl className="mt-12 space-y-7">
            <div><dt className="label">Email</dt><dd><a className="link-u text-lg" href={`mailto:${c.email}`}>{c.email}</a></dd></div>
            {!isPlaceholder(c.phone) && <div><dt className="label">Téléphone</dt><dd><a className="link-u text-lg" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></dd></div>}
            <div><dt className="label">Horaires</dt><dd>{c.hours}</dd></div>
            <div><dt className="label">Zone d&apos;intervention</dt><dd className="max-w-sm leading-relaxed">{c.area}</dd></div>
            {s.integrations.calendlyUrl && <div><dt className="label">Rendez-vous</dt><dd><a className="btn btn-ghost mt-1" href={s.integrations.calendlyUrl} target="_blank" rel="noopener noreferrer">Réserver un créneau ↗</a></dd></div>}
          </dl>
          <div className="light-section mt-12 chamfer"><MapEmbed city={c.city} /></div>
        </div>
        <div className="min-w-0 lg:col-span-7"><QuoteForm presetPlan={formule} /></div>
      </div>
    </section>
  );
}

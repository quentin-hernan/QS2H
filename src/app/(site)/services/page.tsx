import Link from "next/link";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { getServices } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { euro } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Services : création de site, refonte, e-commerce, SEO",
  description: "Site vitrine, site sur mesure, refonte, boutique en ligne, référencement SEO et maintenance : tous les services de l'agence web QS2H, avec prix de départ.",
  path: "/services",
});

export default async function Services() {
  const services = await getServices();
  return (
    <>
      <PageHero eyebrow="Services" title={<>Six façons de faire <span className="serif-it">travailler</span> votre site.</>} lead="Du site vitrine à la boutique en ligne, chaque service est conçu pour un objectif précis : vous faire trouver, vous faire choisir, vous faire contacter.">
        <Breadcrumbs items={[{ name: "Services", path: "/services" }]} />
      </PageHero>
      <section className="light-section py-20 md:py-28">
        <div className="container">
          <ul className="grid gap-px border hair bg-[rgb(12_14_17/0.14)] md:grid-cols-2">
            {services.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={(i % 2) * 0.08} className="bg-ivory">
                <Link href={`/services/${s.slug}`} className="group flex h-full min-h-[22rem] flex-col justify-between p-8 transition-colors duration-500 hover:bg-ivory-200 md:p-12" data-cursor>
                  <div>
                    <p className="muted text-[0.85rem] tabular-nums">0{i + 1}</p>
                    <h2 className="mt-10 text-h2 font-medium group-hover:acc transition-colors">{s.title}</h2>
                    <p className="muted mt-4 max-w-[44ch] leading-relaxed">{s.tagline}</p>
                  </div>
                  <div className="mt-10 flex items-end justify-between">
                    <p><span className="muted text-[0.78rem] uppercase tracking-wider">À partir de</span><br /><span className="text-2xl font-medium">{euro(s.priceFrom)}</span> <span className="muted text-sm">{s.priceUnit.replace("€ ", "")}</span></p>
                    <span className="acc text-2xl transition-transform duration-500 group-hover:translate-x-2" aria-hidden="true">→</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand title="Un projet en tête ?" text="Décrivez-le en quelques lignes, nous vous répondons avec une estimation chiffrée sous 24 heures ouvrées." />
    </>
  );
}

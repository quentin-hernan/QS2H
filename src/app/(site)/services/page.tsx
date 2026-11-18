import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { ServicesStage } from "@/components/Scenes";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getServices, getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services : création de site, refonte, e-commerce, SEO",
  description: "Site vitrine, site sur mesure, refonte, boutique en ligne, référencement SEO et maintenance : tous les services de l'agence web QS2H, avec prix de départ.",
  path: "/services",
});

export default async function Services() {
  const sp = await getPage("services");
  const services = await getServices();
  return (
    <>
      <PageHero eyebrow="Services" title={<>Six façons de faire <span className="serif-it">travailler</span> votre site.</>} lead="Du site vitrine à la boutique en ligne, chaque service est conçu pour un objectif précis : vous faire trouver, vous faire choisir, vous faire contacter.">
        <Breadcrumbs items={[{ name: "Services", path: "/services" }]} />
      </PageHero>
      <section className="light-section py-20 md:py-28" aria-label="Les six services">
        <div className="container"><ServicesStage services={services.map((x) => ({ slug: x.slug, title: x.title, tagline: x.tagline, priceFrom: x.priceFrom, priceUnit: x.priceUnit }))} /></div>
      </section>
      {((sp.media ?? []) as MediaItemT[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <CtaBand title="Un projet en tête ?" text="Décrivez-le en quelques lignes, nous vous répondons avec une estimation chiffrée sous 24 heures ouvrées." />
    </>
  );
}

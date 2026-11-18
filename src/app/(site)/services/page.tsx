import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { ServicesStage } from "@/components/Scenes";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { getServices, getPage, getProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services : création de site, refonte, e-commerce, SEO",
  description: "Site vitrine, site sur mesure, refonte, boutique en ligne, référencement SEO et maintenance : tous les services de l'agence web QS2H, avec prix de départ.",
  path: "/services",
});

export default async function Services() {
  const sp = await getPage("services");
  const [services, products] = await Promise.all([getServices(), getProducts()]);
  return (
    <>
      <PageHero image={sp.heroImage || ""} eyebrow="Services" title={<>Six façons de faire <span className="serif-it">travailler</span> votre site.</>} lead="Du site vitrine à la boutique en ligne, chaque service est conçu pour un objectif précis : vous faire trouver, vous faire choisir, vous faire contacter.">
        <Breadcrumbs items={[{ name: "Services", path: "/services" }]} />
      </PageHero>
      <section className="light-section py-20 md:py-28" aria-label="Les six services">
        <div className="container"><ServicesStage services={services.map((x) => ({ slug: x.slug, title: x.title, tagline: x.tagline, priceFrom: x.priceFrom, priceUnit: x.priceUnit }))} /></div>
      </section>
      {((sp.media ?? []) as MediaItemT[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      {products.length > 0 && (
        <section className="bg-ivory-200 py-16 text-ink-900 md:py-20" aria-label="Catalogue">
          <div className="container flex flex-wrap items-center justify-between gap-6">
            <div><h2 className="text-h3 font-medium">Aussi au catalogue</h2><p className="muted mt-2 max-w-prose">{products.slice(0, 4).map((p) => p.title).join(", ")}{products.length > 4 ? "…" : ""}</p></div>
            <Link href="/catalogue" className="btn btn-primary btn-fill"><span>Voir le catalogue</span></Link>
          </div>
        </section>
      )}
      <CtaBand title="Un projet en tête ?" text="Décrivez-le en quelques lignes, nous vous répondons avec une estimation chiffrée sous 24 heures ouvrées." />
    </>
  );
}

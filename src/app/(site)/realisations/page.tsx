import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RealisationsView } from "@/components/RealisationsView";
import { getProjects, getServices } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Réalisations : sites web pour artisans, restaurants, cabinets, boutiques",
  description: "Découvrez les sites créés par QS2H pour des entreprises de secteurs variés : artisan, restaurant, cabinet, e-commerce, coach, immobilier.",
  path: "/realisations",
});

export default async function Realisations() {
  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  const sectors = [...new Set(projects.map((p) => p.sector))];
  return (
    <>
      <PageHero eyebrow="Réalisations" title={<>Des sites pensés pour <span className="serif-it">chaque métier.</span></>} lead="Artisan, restaurant, cabinet, boutique : chaque projet part de l'activité du client, pas d'un modèle.">
        <Breadcrumbs items={[{ name: "Réalisations", path: "/realisations" }]} />
      </PageHero>
      <section className="light-section py-16 md:py-24" aria-label="Explorer les projets">
        <div className="container">
          <RealisationsView
            desk={projects.map((p) => ({ slug: p.slug, title: p.title, client: p.client, sector: p.sector, year: p.year, summary: p.summary, cover: p.cover, url: p.url, isExample: p.isExample, duration: p.duration, beforeImage: p.beforeImage, planes: p.planes, meta: p.meta }))}
            list={projects.map((p) => ({ slug: p.slug, title: p.title, sector: p.sector, summary: p.summary, cover: p.cover, isExample: p.isExample, services: p.services }))}
            sectors={sectors}
            services={services.map((x) => ({ slug: x.slug, title: x.title }))}
          />
          {projects.some((p) => p.isExample) && <p className="muted mt-16 max-w-xl text-[0.9rem]">Les projets marqués « Projet concept » ont été conçus par QS2H pour illustrer notre façon de travailler : ils ne représentent aucun client. Nos réalisations pour des clients s&apos;ajoutent ici, avec leur accord, au fil des livraisons.</p>}
        </div>
      </section>
      <CtaBand title="Votre projet, ici." text="Racontez-nous votre activité : nous vous proposons un site à son image." />
    </>
  );
}

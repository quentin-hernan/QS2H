import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProjectsFilter } from "@/components/ProjectsFilter";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { getProjects, getServices, getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { lighten } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Réalisations : sites web pour artisans, restaurants, cabinets, boutiques",
  description: "Découvrez les sites créés par QS2H pour des entreprises de secteurs variés : artisan, restaurant, cabinet, e-commerce, coach, immobilier.",
  path: "/realisations",
});

export default async function Realisations() {
  const [projects, services, s] = await Promise.all([getProjects(), getServices(), getSettings()]);
  const accent = `rgb(${lighten(s.theme.accent).split(" ").join(",")})`;
  const sectors = [...new Set(projects.map((p) => p.sector))];
  return (
    <>
      <PageHero eyebrow="Réalisations" title={<>Des sites pensés pour <span className="serif-it">chaque métier.</span></>} lead="Artisan, restaurant, cabinet, boutique : chaque projet part de l'activité du client, pas d'un modèle.">
        <Breadcrumbs items={[{ name: "Réalisations", path: "/realisations" }]} />
      </PageHero>
      <section className="dark-section pb-20">
        <div className="container"><ProjectsGallery level={2} items={projects.map((p) => ({ slug: p.slug, title: p.title, sector: p.sector, cover: p.cover, summary: p.summary, isExample: p.isExample }))} accent={accent} /></div>
      </section>
      <section className="light-section py-20 md:py-28" aria-label="Liste des réalisations">
        <div className="container">
          <ProjectsFilter level={2} projects={projects.map((p) => ({ slug: p.slug, title: p.title, sector: p.sector, summary: p.summary, cover: p.cover, isExample: p.isExample, services: p.services }))} sectors={sectors} services={services.map((x) => ({ slug: x.slug, title: x.title }))} />
          {projects.some((p) => p.isExample) && <p className="muted mt-16 max-w-xl text-[0.9rem]">Les projets marqués « Projet concept » ont été conçus par QS2H pour illustrer notre façon de travailler : ils ne représentent aucun client. Nos réalisations pour des clients s’ajoutent ici, avec leur accord, au fil des livraisons.</p>}
        </div>
      </section>
      <CtaBand title="Votre projet, ici." text="Racontez-nous votre activité : nous vous proposons un site à son image." />
    </>
  );
}

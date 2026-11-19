import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { OpenViewer } from "@/components/OpenViewer";
import { getProject, getProjects, getServices } from "@/lib/content";
import { buildMetadata, creativeWorkJsonLd } from "@/lib/seo";

type P = { params: Promise<{ slug: string }> };

// rendu à chaque visite : les modifications de l'admin apparaissent tout de suite
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.seoTitle || `${p.title} — réalisation`, description: p.seoDescription || p.summary, path: `/realisations/${p.slug}`, image: p.cover || undefined });
}

export default async function ProjectPage({ params }: P) {
  const { slug } = await params;
  const [p, all, services] = await Promise.all([getProject(slug), getProjects(), getServices()]);
  if (!p) notFound();
  const idx = all.findIndex((x) => x.slug === p.slug);
  const next = all[(idx + 1) % all.length];
  const svc = services.filter((s) => p.services.includes(s.slug));
  const shots = p.images.length ? p.images : p.cover ? [p.cover] : [];
  return (
    <>
      <JsonLd data={creativeWorkJsonLd(p)} />
      <PageHero eyebrow={`${p.sector} · ${p.client}`} title={p.title} lead={p.summary}>
        <Breadcrumbs items={[{ name: "Réalisations", path: "/realisations" }, { name: p.title, path: `/realisations/${p.slug}` }]} />
        {p.isExample && <p className="mb-6 inline-block border hair px-4 py-1.5 text-[0.8rem] uppercase tracking-[0.14em] muted">Projet concept — réalisé par QS2H, sans client</p>}
      </PageHero>

      {shots[0] && (
        <section className="dark-section pb-20">
          <div className="container">
            <Reveal><div className="relative aspect-[8/5] overflow-hidden chamfer border hair"><Image src={shots[0]} alt={`Capture du site ${p.title}`} fill priority sizes="(min-width:1280px) 1200px, 100vw" className="object-cover" /></div></Reveal>
          </div>
        </section>
      )}

      {p.planes.length > 0 && (
        <section className="dark-section pb-16" aria-label="Vue éclatée">
          <div className="container flex flex-wrap items-center justify-between gap-6 border-t hair pt-10">
            <p className="max-w-xl text-[1.05rem]">Découvrez ce site en vue éclatée : navigation, accueil, sections et version mobile, plan par plan.</p>
            <OpenViewer slug={p.slug} />
          </div>
        </section>
      )}

      <section className="light-section py-20 md:py-32">
        <div className="container grid gap-16 lg:grid-cols-12">
          <dl className="space-y-8 lg:col-span-3">
            <div><dt className="label">Client</dt><dd className="font-medium">{p.client}</dd></div>
            <div><dt className="label">Secteur</dt><dd className="font-medium">{p.sector}</dd></div>
            {svc.length > 0 && (<div><dt className="label">Services</dt><dd className="space-y-1">{svc.map((s) => (<Link key={s.slug} className="link-u block font-medium" href={`/services/${s.slug}`}>{s.title}</Link>))}</dd></div>)}
            {p.technologies.length > 0 && (<div><dt className="label">Technologies</dt><dd className="flex flex-wrap gap-2">{p.technologies.map((t) => (<span key={t} className="hair border px-3 py-1 text-[0.85rem]">{t}</span>))}</dd></div>)}
            {p.url && (<div><dt className="label">Site</dt><dd><a href={p.url} rel="noopener noreferrer" target="_blank" className="link-u acc">Visiter le site ↗</a></dd></div>)}
          </dl>
          <div className="space-y-14 lg:col-span-8 lg:col-start-5">
            {p.challenge && <Reveal><h2 className="eyebrow mb-5">Contexte et objectifs</h2><p className="prose-qs">{p.challenge}</p></Reveal>}
            {p.solution && <Reveal><h2 className="eyebrow mb-5">Solution</h2><p className="prose-qs">{p.solution}</p></Reveal>}
            {p.results.length > 0 && (
              <Reveal>
                <h2 className="eyebrow mb-6">Résultats</h2>
                <dl className="grid gap-px border hair bg-[rgb(12_14_17/0.14)] sm:grid-cols-2">
                  {p.results.map((r) => (<div key={r.label} className="bg-ivory p-8"><dd className="font-serif text-6xl leading-none acc">{r.value}</dd><dt className="muted mt-3">{r.label}</dt></div>))}
                </dl>
              </Reveal>
            )}
            {p.testimonial && (
              <Reveal><figure><blockquote className="font-serif text-[clamp(1.6rem,2.8vw,2.4rem)] leading-[1.2]">« {p.testimonial} »</blockquote><figcaption className="muted mt-5">{p.testimonialBy}</figcaption></figure></Reveal>
            )}
            {p.planes.length > 0 && (
              <Reveal>
                <h2 className="eyebrow mb-6">Les plans du site</h2>
                <ol className="space-y-6">
                  {p.planes.map((pl) => (<li key={pl.id}><p className="font-medium">{pl.name}</p>{pl.caption && <p className="muted mt-1 text-[0.95rem]">{pl.caption}</p>}</li>))}
                </ol>
              </Reveal>
            )}
            {shots.slice(1).map((src) => (<Reveal key={src}><div className="relative aspect-[8/5] overflow-hidden chamfer border hair"><Image src={src} alt={`Capture supplémentaire de ${p.title}`} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" /></div></Reveal>))}
          </div>
        </div>
      </section>

      {next && next.slug !== p.slug && (
        <section className="bg-ivory-200 py-20 text-ink-900"><div className="container"><p className="eyebrow mb-8">Projet suivant</p><div className="max-w-xl"><ProjectCard p={next} /></div></div></section>
      )}
      <CtaBand title="À vous de jouer." text="Parlez-nous de votre activité : nous vous proposons un site à son image, avec un prix fixe." />
    </>
  );
}

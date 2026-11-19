import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { ServiceArt } from "@/components/ServiceArt";
import { ProblemSolution } from "@/components/ProblemSolution";
import { ProjectCard } from "@/components/ProjectCard";
import { getProjects, getService, getServices } from "@/lib/content";
import { buildMetadata, faqJsonLd, serviceJsonLd } from "@/lib/seo";
import { euro } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };

// rendu à chaque visite : les modifications de l'admin apparaissent tout de suite
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await getService((await params).slug);
  if (!s) return {};
  return buildMetadata({ title: s.seoTitle || `${s.title} | QS2H`, description: s.seoDescription || s.tagline, path: `/services/${s.slug}` });
}

export default async function ServicePage({ params }: P) {
  const { slug } = await params;
  const [s, all, projects] = await Promise.all([getService(slug), getServices(), getProjects()]);
  if (!s) notFound();
  const related = projects.filter((p) => p.services.includes(s.slug)).slice(0, 3);
  const others = all.filter((x) => x.slug !== s.slug).slice(0, 3);
  return (
    <>
      <JsonLd data={serviceJsonLd(s)} />
      {s.faq.length > 0 && <JsonLd data={faqJsonLd(s.faq)} />}
      <PageHero eyebrow="" image={s.image || ""} art={s.image ? undefined : <ServiceArt slug={s.slug} />} title={s.title} lead={s.tagline}
        after={(
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/contact" className="btn btn-primary btn-fill btn-arrow"><span>Demander un devis</span><span aria-hidden="true" className="arr">→</span></Link>
            <p className="muted text-[0.95rem]">À partir de <strong className="text-lg font-medium">{euro(s.priceFrom)}</strong> {s.priceUnit.replace("€ ", "")} · {s.duration}</p>
          </div>
        )}>
        <Breadcrumbs items={[{ name: "Services", path: "/services" }, { name: s.title, path: `/services/${s.slug}` }]} />
      </PageHero>

      <ProblemSolution slug={s.slug} problem={s.problem} solution={s.solution} />

      <section className="bg-ivory-200 py-20 text-ink-900 md:py-32">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow mb-6">Livrables</p><h2 className="text-h2 font-medium">Ce que vous recevez.</h2></div>
          <ul className="lg:col-span-8">
            {s.deliverables.map((d, i) => (
              <Reveal as="li" key={d} delay={i * 0.05} className="hair flex gap-5 border-t py-5 last:border-b"><span className="acc tabular-nums">0{i + 1}</span><span className="text-[1.1rem]">{d}</span></Reveal>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="light-section py-20 md:py-32">
          <div className="container">
            <p className="eyebrow mb-6">Réalisations liées</p>
            <div className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-3">{related.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
          </div>
        </section>
      )}

      {s.faq.length > 0 && (
        <section className="light-section pb-20 md:pb-32">
          <div className="container grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4"><p className="eyebrow mb-6">Questions</p><h2 className="text-h2 font-medium">À propos de ce service.</h2></div>
            <div className="lg:col-span-8"><Faq items={s.faq} /></div>
          </div>
        </section>
      )}

      <section className="bg-ivory-200 py-16 text-ink-900">
        <div className="container">
          <p className="eyebrow mb-8">Voir aussi</p>
          <ul className="grid gap-4 md:grid-cols-3">
            {others.map((o) => (<li key={o.slug}><Link href={`/services/${o.slug}`} className="hair group block chamfer border p-6 transition-colors hover:bg-ivory" data-cursor="Voir"><span className="text-h3 font-medium">{o.title}</span><span className="acc float-right transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></Link></li>))}
          </ul>
        </div>
      </section>
      <CtaBand title="Parlons-en." text="Une question sur ce service ? Écrivez-nous, nous répondons sous 24 heures ouvrées." />
    </>
  );
}

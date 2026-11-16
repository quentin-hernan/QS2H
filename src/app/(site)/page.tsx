import Link from "next/link";
import { HomeStage } from "@/components/HomeStage";
import { TrustBar, ServicesList, Reviews, CtaBand } from "@/components/Blocks";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { Timeline } from "@/components/Timeline";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Lines, Reveal } from "@/components/Reveal";
import { getFaqs, getPage, getProjects, getReviews, getServices, getSettings } from "@/lib/content";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { lighten } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "QS2H — Création de sites web pour entreprises à Bordeaux",
  description: "Agence web à Bordeaux : sites vitrines, sur mesure, refonte, e-commerce et référencement. Design soigné, site rapide, devis gratuit sous 24 h ouvrées.",
  path: "/",
});

export default async function Home() {
  const [page, method, s, services, projects, reviews, faqs] = await Promise.all([getPage("home"), getPage("method"), getSettings(), getServices(), getProjects(), getReviews(), getFaqs()]);
  const accent = `rgb(${lighten(s.theme.accent).split(" ").join(",")})`;
  const covers = projects.map((p) => p.cover).filter(Boolean);
  const shortFaq = faqs.slice(0, 5).map((f) => ({ q: f.question, a: f.answer }));
  return (
    <>
      <JsonLd data={faqJsonLd(shortFaq)} />
      <HomeStage hero={{ kicker: page.kicker, line1: page.line1, line2: page.line2, line3: page.line3, lead: page.lead, ctaPrimary: page.ctaPrimary, ctaSecondary: page.ctaSecondary }} layers={page.layers} covers={covers} accent={accent} />

      <TrustBar items={s.trust} />

      <ServicesList services={services} title={page.servicesTitle} lead={page.servicesLead} />

      <section className="dark-section py-24 md:py-36" aria-labelledby="real-h">
        <div className="container">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-6">Réalisations</p>
              <Lines as="h2" lines={[page.projectsTitle]} className="text-h2 font-medium" />
            </div>
            <Reveal><Link href="/realisations" className="btn btn-ghost">Toutes les réalisations</Link></Reveal>
          </div>
          <h2 id="real-h" className="sr-only">Nos réalisations</h2>
          <ProjectsGallery items={projects.slice(0, 6).map((p) => ({ slug: p.slug, title: p.title, sector: p.sector, cover: p.cover, summary: p.summary, isExample: p.isExample }))} accent={accent} />
        </div>
      </section>

      <Reviews reviews={reviews.filter((r) => !r.isExample).map((r) => ({ id: r.id, author: r.author, role: r.role, company: r.company, rating: r.rating, text: r.text, isExample: r.isExample }))} />

      <section className="bg-ivory-200 py-24 text-ink-900 md:py-36" aria-labelledby="proc-h">
        <div className="container grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <p className="eyebrow mb-6">Méthode</p>
              <Lines as="h2" lines={["Du premier échange", "à la mise en ligne."]} className="text-h2 font-medium" />
              <Reveal delay={0.2}><p className="muted mt-6 max-w-sm leading-relaxed">{method.intro}</p></Reveal>
              <Reveal delay={0.3}><Link href="/methode" className="btn btn-ghost mt-8">Détail de la méthode</Link></Reveal>
            </div>
          </div>
          <div className="lg:col-span-8"><h2 id="proc-h" className="sr-only">Les étapes</h2><Timeline steps={method.steps} /></div>
        </div>
      </section>

      <section className="light-section py-24 md:py-36" aria-labelledby="faq-h">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-6">Questions fréquentes</p>
            <Lines as="h2" lines={["Ce que l'on", "nous demande."]} className="text-h2 font-medium" />
            <Reveal delay={0.2}><Link href="/faq" className="btn btn-ghost mt-8">Toute la FAQ</Link></Reveal>
          </div>
          <div className="lg:col-span-8"><h2 id="faq-h" className="sr-only">FAQ</h2><Faq items={shortFaq} /></div>
        </div>
      </section>

      <CtaBand title={page.ctaTitle} text={page.ctaText} />
    </>
  );
}

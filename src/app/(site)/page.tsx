import { HomeStage } from "@/components/HomeStage";
import { Reviews } from "@/components/Blocks";
import { Intro, Showcase, Why, FinalCta } from "@/components/HomeSections";
import { Expertises, ProductDemo, MethodLine, HomeFaq } from "@/components/HomeInteractive";
import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { JsonLd } from "@/components/JsonLd";
import { getFaqs, getPage, getProjects, getReviews, getSettings } from "@/lib/content";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { lighten } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "QS2H — Sites web, marketing digital, automatisation et chatbots à Bordeaux",
  description: "QS2H conçoit des sites web, des stratégies de visibilité, des automatisations, des chatbots et des outils sur mesure pour les indépendants, TPE et PME. Bordeaux et toute la France.",
  path: "/",
});

type Item = { title: string; text: string; href?: string };

/** Accueil : hero 3D, présentation, expertises, démonstrations, réalisations, méthode, raisons, FAQ, appel final. */
export default async function Home() {
  const [page, s, projects, reviews, faqs] = await Promise.all([getPage("home"), getSettings(), getProjects(), getReviews(), getFaqs()]);
  const accent = `rgb(${lighten(s.theme.accent).split(" ").join(",")})`;
  const covers = projects.map((p) => p.cover).filter(Boolean);
  const media = (page.media ?? []) as MediaItemT[];
  const faq = faqs.slice(0, 6).map((f) => ({ q: f.question, a: f.answer }));
  const realReviews = reviews.filter((r) => !r.isExample);
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <HomeStage hero={{ kicker: page.kicker, line1: page.line1, line2: page.line2, line3: page.line3, lead: page.lead, ctaPrimary: page.ctaPrimary, ctaSecondary: page.ctaSecondary }} layers={page.layers} covers={covers} accent={accent} />
      <Intro line1={page.introLine1} line2={page.introLine2} text={page.introText} />
      <Expertises items={(page.expertises ?? []) as Item[]} title={page.servicesTitle} lead={page.servicesLead} bg={page.servicesBg || ""} />
      <ProductDemo title={page.demoTitle} text={page.demoText} />
      <MediaBand item={media[0]} />
      <Showcase title={page.projectsTitle} projects={projects.slice(0, 3).map((p) => ({ slug: p.slug, title: p.title, sector: p.sector, summary: p.summary, cover: p.cover, isExample: p.isExample }))} />
      {realReviews.length > 0 && <Reviews reviews={realReviews.map((r) => ({ id: r.id, author: r.author, role: r.role, company: r.company, rating: r.rating, text: r.text, isExample: r.isExample }))} />}
      <MethodLine title={page.methodTitle} steps={(page.steps ?? []) as Item[]} />
      <Why title={page.whyTitle} items={(page.why ?? []) as Item[]} />
      <MediaBand item={media[1]} tone="dark" />
      <HomeFaq items={faq} />
      {media.slice(2).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <FinalCta title={page.ctaTitle} text={page.ctaText} cta={page.finalCta} />
    </>
  );
}

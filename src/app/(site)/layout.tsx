import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { LightDriver, PageTransitions, Preloader, ScrollUI } from "@/components/Motion";
import { JsonLd } from "@/components/JsonLd";
import { getProjects, getReviews, getSettings } from "@/lib/content";
import { ViewerProvider } from "@/components/ProjectViewer";
import { orgJsonLd, websiteJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, reviews, projects] = await Promise.all([getSettings(), getReviews(), getProjects()]);
  const vp = projects.filter((p) => p.planes.length).map((p) => ({ slug: p.slug, title: p.title, client: p.client, sector: p.sector, year: p.year, isExample: p.isExample, url: p.url, summary: p.summary, planes: p.planes, meta: p.meta }));
  // AggregateRating uniquement avec de vrais avis (jamais avec les avis d'exemple)
  const real = reviews.filter((r) => !r.isExample);
  const rating = real.length ? { value: Math.round((real.reduce((a, r) => a + r.rating, 0) / real.length) * 10) / 10, count: real.length } : null;
  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <JsonLd data={[orgJsonLd(s, rating), websiteJsonLd()]} />
      <SmoothScroll />
      <Cursor />
      <Preloader />
      <PageTransitions />
      <LightDriver />
      <ScrollUI />
      <Header />
      <ViewerProvider projects={vp}>
        <main id="contenu">{children}</main>
      </ViewerProvider>
      <Footer />
      <CookieBanner plausibleDomain={s.integrations.plausibleDomain} />
    </>
  );
}

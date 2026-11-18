import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { Chatbot } from "@/components/Chatbot";
import { SiteAppearance } from "@/components/SiteAppearance";
import { LightDriver, PageTransitions, Preloader, ScrollUI } from "@/components/Motion";
import { JsonLd } from "@/components/JsonLd";
import { getProjects, getProducts, getReviews, getServices, getSettings } from "@/lib/content";
import { ViewerProvider } from "@/components/ProjectViewer";
import { SlotsProvider } from "@/components/ImgSlot";
import { CartProvider } from "@/components/shop/Cart";
import { orgJsonLd, websiteJsonLd } from "@/lib/seo";

// Pages rendues à chaque visite : les modifications faites dans l'administration apparaissent immédiatement (les données restent mises en cache par étiquette).
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, reviews, projects, services, products] = await Promise.all([getSettings(), getReviews(), getProjects(), getServices(), getProducts()]);
  const vp = projects.filter((p) => p.planes.length).map((p) => ({ slug: p.slug, title: p.title, client: p.client, sector: p.sector, year: p.year, isExample: p.isExample, url: p.url, summary: p.summary, planes: p.planes, meta: p.meta }));
  // AggregateRating uniquement avec de vrais avis (jamais avec les avis d'exemple)
  const real = reviews.filter((r) => !r.isExample);
  const rating = real.length ? { value: Math.round((real.reduce((a, r) => a + r.rating, 0) / real.length) * 10) / 10, count: real.length } : null;
  return (
    <>
    <CartProvider>
    <div className="site-shell">
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <JsonLd data={[orgJsonLd(s, rating), websiteJsonLd()]} />
      <SmoothScroll />
      <Cursor />
      <Preloader />
      <PageTransitions />
      <LightDriver />
      <ScrollUI />
      <Header email={s.company.email} hasCatalogue={products.length > 0} services={services.map((x) => ({ slug: x.slug, title: x.title, tagline: x.tagline }))} />
      <SlotsProvider slots={s.slots ?? {}}>
      <ViewerProvider projects={vp}>
        <main id="contenu">{children}</main>
      </ViewerProvider>
      </SlotsProvider>
      <Footer />
      <Chatbot />
      <SiteAppearance styles={s.sectionStyles ?? {}} overrides={s.overrides ?? {}} />
      <CookieBanner plausibleDomain={s.integrations.plausibleDomain} />
    </div>
    </CartProvider>
    </>
  );
}

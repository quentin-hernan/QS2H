import { HomeStage } from "@/components/HomeStage";
import { TrustBar, ServicesList, Reviews, CtaBand } from "@/components/Blocks";
import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { getPage, getProjects, getReviews, getServices, getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { lighten } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "QS2H — Création de sites web pour entreprises à Bordeaux",
  description: "Agence web à Bordeaux : sites vitrines, sur mesure, refonte, e-commerce et référencement. Design soigné, site rapide, devis gratuit sous 24 h ouvrées.",
  path: "/",
});

/** Accueil : on présente, on renvoie vers les pages détaillées (réalisations, méthode, FAQ, tarifs) sans les répéter. */
export default async function Home() {
  const [page, s, services, projects, reviews] = await Promise.all([getPage("home"), getSettings(), getServices(), getProjects(), getReviews()]);
  const accent = `rgb(${lighten(s.theme.accent).split(" ").join(",")})`;
  const covers = projects.map((p) => p.cover).filter(Boolean);
  const media = (page.media ?? []) as MediaItemT[];
  return (
    <>
      <HomeStage hero={{ kicker: page.kicker, line1: page.line1, line2: page.line2, line3: page.line3, lead: page.lead, ctaPrimary: page.ctaPrimary, ctaSecondary: page.ctaSecondary }} layers={page.layers} covers={covers} accent={accent} />

      <TrustBar items={s.trust} />
      <ServicesList services={services} title={page.servicesTitle} lead={page.servicesLead} bg={page.servicesBg || ""} />

      <MediaBand item={media[0]} />
      <MediaBand item={media[1]} tone="dark" />
      <Reviews reviews={reviews.filter((r) => !r.isExample).map((r) => ({ id: r.id, author: r.author, role: r.role, company: r.company, rating: r.rating, text: r.text, isExample: r.isExample }))} />
      {media.slice(2).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}

      <CtaBand title={page.ctaTitle} text={page.ctaText} />
    </>
  );
}

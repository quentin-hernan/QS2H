import { HomeStage } from "@/components/HomeStage";
import { Reviews } from "@/components/Blocks";
import { Intro, Why, FinalCta } from "@/components/HomeSections";
import { Expertises, ProductDemo } from "@/components/HomeInteractive";
import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { getPage, getProjects, getReviews, getSettings, getShopItems } from "@/lib/content";
import { ShopTeaser } from "@/components/shop/ShopTeaser";
import { buildMetadata } from "@/lib/seo";
import { lighten } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "QS2H — Sites web, marketing digital, automatisation et chatbots à La Rochelle",
  description: "QS2H conçoit des sites web, des stratégies de visibilité, des automatisations, des chatbots et des outils sur mesure pour les indépendants, TPE et PME. La Rochelle et toute la France.",
  path: "/",
});

type Item = { title: string; text: string; href?: string };

/** Accueil : hero 3D, présentation, expertises, démonstrations, raisons, appel final. Réalisations, méthode et FAQ ont leurs pages dédiées. */
export default async function Home() {
  const [page, s, projects, reviews, shop] = await Promise.all([getPage("home"), getSettings(), getProjects(), getReviews(), getShopItems()]);
  const accent = `rgb(${lighten(s.theme.accent).split(" ").join(",")})`;
  // écran du portable : captures entières de chaque réalisation, empilées (menu, haut de page, section) ; sinon la couverture
  // écran du portable : sites choisis dans l'admin (Pages et textes > Accueil), sinon pages entières des réalisations
  const custom = ((page.screenSites ?? []) as { src?: string }[]).map((x) => (x.src || "").trim()).filter(Boolean);
  const covers = custom.length ? custom : projects.map((p) => {
    const pick = p.planes.filter((x) => ["nav", "hero", "section", "footer"].includes(x.kind)).map((x) => x.image).filter(Boolean);
    return pick.length ? pick.join("|") : p.cover;
  }).filter(Boolean);
  const media = (page.media ?? []) as MediaItemT[];
  const realReviews = reviews.filter((r) => !r.isExample);
  return (
    <>
      <HomeStage hero={{ kicker: page.kicker, line1: page.line1, line2: page.line2, line3: page.line3, lead: page.lead, ctaPrimary: page.ctaPrimary, ctaSecondary: page.ctaSecondary }} layers={page.layers} covers={covers} accent={accent} bg={{ src: page.heroBg || "", dim: Math.min(100, Math.max(0, Number(page.heroBgDim) || 55)) }} />
      <Intro line1={page.introLine1} line2={page.introLine2} text={page.introText} bg={page.introBg || ""} />
      <Expertises items={(page.expertises ?? []) as Item[]} title={page.servicesTitle} lead={page.servicesLead} bg={page.servicesBg || ""} />
      <ShopTeaser items={shop} title={page.shopTitle || "Visitez notre boutique."} text={page.shopText || ""} />
      <ProductDemo title={page.demoTitle} text={page.demoText} />
      <MediaBand item={media[0]} />
      {realReviews.length > 0 && <Reviews reviews={realReviews.map((r) => ({ id: r.id, author: r.author, role: r.role, company: r.company, rating: r.rating, text: r.text, isExample: r.isExample, photo: r.photo }))} />}
      <Why title={page.whyTitle} items={(page.why ?? []) as Item[]} />
      <MediaBand item={media[1]} tone="dark" />
      {media.slice(2).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <FinalCta title={page.ctaTitle} text={page.ctaText} cta={page.finalCta} />
    </>
  );
}

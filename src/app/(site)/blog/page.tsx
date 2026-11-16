import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SheetStack } from "@/components/Scenes";
import { BlogList } from "@/components/BlogList";
import { getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate, readingMinutes } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Blog : conseils création de site web et référencement",
  description: "Prix d'un site, vitrine ou sur mesure, SEO local à Bordeaux : les conseils de QS2H pour réussir votre présence en ligne.",
  path: "/blog",
});

export default async function Blog() {
  const all = await getPosts();
  return (
    <>
      <PageHero eyebrow="Blog" title={<>Conseils pour un site qui <span className="serif-it">fait venir des clients.</span></>} lead="Budget, choix techniques, référencement local : des articles concrets, sans jargon.">
        <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
        <SheetStack />
      </PageHero>
      <section className="light-section py-16 md:py-24" aria-label="Articles">
        <div className="container">
          <BlogList posts={all.map((p) => ({ id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category, cover: p.cover, date: formatDate(p.publishedAt), minutes: readingMinutes(p.content) }))} />
        </div>
      </section>
      <CtaBand title="Besoin d'un avis ?" text="Parlez-nous de votre projet, nous vous conseillons gratuitement." />
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate, readingMinutes } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Blog : conseils création de site web et référencement",
  description: "Prix d'un site, vitrine ou sur mesure, SEO local à Bordeaux : les conseils de QS2H pour réussir votre présence en ligne.",
  path: "/blog",
});

export default async function Blog({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const { categorie } = await searchParams;
  const all = await getPosts();
  const cats = [...new Set(all.map((p) => p.category))];
  const posts = categorie ? all.filter((p) => p.category === categorie) : all;
  return (
    <>
      <PageHero eyebrow="Blog" title={<>Conseils pour un site qui <span className="serif-it">fait venir des clients.</span></>} lead="Budget, choix techniques, référencement local : des articles concrets, sans jargon.">
        <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
      </PageHero>
      <section className="light-section py-16 md:py-24">
        <div className="container">
          <nav aria-label="Catégories" className="mb-14 flex flex-wrap gap-2">
            <Link href="/blog" className={` border px-4 py-2 text-[0.9rem] hair ${!categorie ? "bg-ink-900 text-ivory border-transparent" : "hover:bg-ink-900/5"}`}>Tous</Link>
            {cats.map((c) => (<Link key={c} href={`/blog?categorie=${encodeURIComponent(c)}`} className={` border px-4 py-2 text-[0.9rem] hair ${categorie === c ? "bg-ink-900 text-ivory border-transparent" : "hover:bg-ink-900/5"}`}>{c}</Link>))}
          </nav>
          <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 3) * 0.08}>
                <Link href={`/blog/${p.slug}`} className="group block" data-cursor="Lire">
                  <div className="relative aspect-[3/2] overflow-hidden chamfer border hair bg-ink-900">
                    {p.cover ? <Image src={p.cover} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-end p-6"><span className="font-serif text-4xl italic text-ivory/80">{p.category}</span></div>}
                  </div>
                  <p className="muted mt-5 text-[0.82rem] uppercase tracking-wider">{p.category} · {formatDate(p.publishedAt)} · {readingMinutes(p.content)} min</p>
                  <h2 className="mt-2 text-h3 font-medium transition-colors group-hover:acc">{p.title}</h2>
                  <p className="muted mt-3 leading-relaxed">{p.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
          {posts.length === 0 && <p className="muted py-20 text-center">Aucun article pour le moment.</p>}
        </div>
      </section>
      <CtaBand title="Besoin d'un avis ?" text="Parlez-nous de votre projet, nous vous conseillons gratuitement." />
    </>
  );
}

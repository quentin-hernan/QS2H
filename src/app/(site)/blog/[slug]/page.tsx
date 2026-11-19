import Link from "next/link";
import Image from "next/image";
import { TocNav } from "@/components/TocNav";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaBand } from "@/components/Blocks";
import { JsonLd } from "@/components/JsonLd";
import { getPost, getPosts } from "@/lib/content";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate, readingMinutes, slugify } from "@/lib/utils";
import { cleanHtml } from "@/lib/sanitize";

type P = { params: Promise<{ slug: string }> };

// rendu à chaque visite : les modifications de l'admin apparaissent tout de suite
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.seoTitle || p.title, description: p.seoDescription || p.excerpt, path: `/blog/${p.slug}`, image: p.cover || undefined, type: "article", publishedTime: p.publishedAt?.toISOString() });
}

/** Ajoute des ids aux h2 et construit le sommaire automatique. */
function withToc(html: string) {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs, inner) => {
    const text = sanitizeHtml(inner, { allowedTags: [] });
    let id = slugify(text) || `section-${toc.length + 1}`;
    if (toc.some((t) => t.id === id)) id += `-${toc.length}`;
    toc.push({ id, text });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export default async function PostPage({ params }: P) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getPost(slug), getPosts()]);
  if (!post) notFound();
  const { html, toc } = withToc(cleanHtml(post.content));
  const related = all.filter((p) => p.slug !== post.slug).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 2);
  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <article>
        <header className="dark-section pb-16 pt-40 md:pb-24 md:pt-52">
          <div className="container">
            <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />
            <p className="eyebrow mb-6">{post.category}</p>
            <h1 className="max-w-[22ch] text-h1 font-medium">{post.title}</h1>
            <p className="muted mt-8 max-w-2xl text-[1.2rem] leading-relaxed">{post.excerpt}</p>
            <p className="muted mt-8 text-[0.9rem]">Par {post.author} · <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time> · {readingMinutes(post.content)} min de lecture</p>
          </div>
        </header>
        <div className="light-section py-16 md:py-24">
          <div className="container grid gap-12 lg:grid-cols-12">
            {toc.length > 1 && (
              <aside className="lg:col-span-3"><TocNav toc={toc} /></aside>
            )}
            <div className={toc.length > 1 ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-8 lg:col-start-3"}>
              {post.cover && <div className="relative mb-12 aspect-[3/2] overflow-hidden chamfer"><Image src={post.cover} alt="" fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" /></div>}
              <div className="prose-qs [&_h2]:scroll-mt-32" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        </div>
      </article>
      {related.length > 0 && (
        <section className="bg-ivory-200 py-20 text-ink-900"><div className="container"><p className="eyebrow mb-8">À lire aussi</p>
          <ul className="grid gap-6 md:grid-cols-2">{related.map((r) => (<li key={r.id}><Link href={`/blog/${r.slug}`} className="hair group block chamfer border p-8 transition-colors hover:bg-ivory" data-cursor="Lire"><p className="muted text-[0.8rem] uppercase tracking-wider">{r.category}</p><h2 className="mt-3 text-h3 font-medium group-hover:acc">{r.title}</h2></Link></li>))}</ul>
        </div></section>
      )}
      <CtaBand title="Un projet de site ?" text="Parlez-nous de votre activité. Devis gratuit sous 24 heures ouvrées." />
    </>
  );
}

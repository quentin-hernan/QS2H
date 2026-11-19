import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Gallery, ProductBuy } from "@/components/shop/ProductBuy";
import { ShopCard } from "@/components/shop/ShopCard";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { getShopItem, getShopItems } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { discount, money, stockState } from "@/lib/shop";
import { SITE_URL } from "@/lib/utils";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getShopItem((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.seoTitle || `${p.title} | Boutique QS2H`, description: p.seoDescription || p.tagline || p.description.slice(0, 160), path: `/boutique/${p.slug}` });
}

export default async function ShopItemPage({ params }: P) {
  const { slug } = await params;
  const [p, all] = await Promise.all([getShopItem(slug), getShopItems()]);
  if (!p) notFound();
  const imgs = [p.image, ...p.images].filter(Boolean);
  const off = discount(p.price, p.comparePrice);
  const st = stockState(p.stock);
  const related = all.filter((x) => x.slug !== p.slug && x.category === p.category).concat(all.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 4);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.tagline || p.description, image: imgs.map((u) => (u.startsWith("http") ? u : SITE_URL + u)), brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined, offers: { "@type": "Offer", priceCurrency: "EUR", price: p.price.toFixed(2), availability: p.stock === 0 ? "https://schema.org/OutOfStock" : p.stock < 0 ? "https://schema.org/PreOrder" : "https://schema.org/InStock", url: `${SITE_URL}/boutique/${p.slug}` } }} />
      <section className="light-section pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="container">
          <Breadcrumbs items={[{ name: "Boutique", path: "/boutique" }, { name: p.title, path: `/boutique/${p.slug}` }]} />
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6"><Gallery images={imgs} title={p.title} /></div>
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-28">
                <p className="muted text-[0.8rem] uppercase tracking-[0.14em]">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>
                <h1 className="mt-3 text-h2 font-medium">{p.title}</h1>
                {p.tagline && <p className="muted mt-3 text-[1.05rem] leading-relaxed">{p.tagline}</p>}
                <div className="mt-6 flex flex-wrap items-baseline gap-3">
                  <span className="text-[2rem] font-semibold">{money(p.price)}</span>
                  {off > 0 && <><s className="muted text-lg">{money(p.comparePrice)}</s><span className="shop-badge is-sale !static">−{off} %</span></>}
                  <span className="muted text-sm">TTC</span>
                </div>
                <p className={`mt-2 text-sm stock-${st.tone}`}>● {st.label}</p>
                {p.isExample && <p className="muted mt-2 text-sm">Article d&apos;exemple : à remplacer depuis l&apos;administration.</p>}
                <div className="mt-7"><ProductBuy slug={p.slug} title={p.title} price={p.price} image={p.image || imgs[0] || ""} stock={p.stock} /></div>
                <ul className="mt-7 space-y-2 border-t hair pt-6 text-[0.92rem]">
                  <li className="flex gap-3"><span className="acc">✓</span>Commande sans paiement en ligne : facture envoyée après confirmation</li>
                  <li className="flex gap-3"><span className="acc">✓</span>Livraison ou retrait à La Rochelle</li>
                  <li className="flex gap-3"><span className="acc">✓</span>Conseil et installation possibles</li>
                </ul>
                {p.features.length > 0 && (
                  <div className="mt-8"><h2 className="text-[1.05rem] font-semibold">Points forts</h2><ul className="mt-3 space-y-2">{p.features.map((f) => (<li key={f} className="flex gap-3 text-[0.97rem]"><span className="acc" aria-hidden="true">—</span>{f}</li>))}</ul></div>
                )}
              </div>
            </div>
          </div>

          {p.blocks.length > 0 && (
            <div className="mt-20 space-y-16 md:space-y-24">
              {p.blocks.map((bk, i) => (
                <Reveal key={i}>
                  <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                    <div className="shop-block-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {bk.image ? <img src={bk.image} alt={bk.title || ""} loading="lazy" className="h-full w-full object-cover" /> : <span className="shop-ph" aria-hidden="true">{(bk.title || p.title).slice(0, 1)}</span>}
                    </div>
                    <div>{bk.title && <h2 className="text-h3 font-medium">{bk.title}</h2>}{bk.text && <p className="muted mt-4 whitespace-pre-line text-[1.02rem] leading-relaxed">{bk.text}</p>}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {(p.description || p.specs.length > 0) && (
            <div className="mt-20 grid gap-12 border-t hair pt-14 lg:grid-cols-12">
              {p.description && <div className="lg:col-span-7"><h2 className="text-h3 font-medium">Description</h2><div className="prose-qs mt-5 whitespace-pre-line">{p.description}</div></div>}
              {p.specs.length > 0 && (
                <div className="lg:col-span-5"><h2 className="text-h3 font-medium">Caractéristiques</h2>
                  <dl className="mt-5 divide-y hair border-y hair">{p.specs.map((s) => (<div key={s.label} className="grid grid-cols-2 gap-4 py-3 text-[0.95rem]"><dt className="muted">{s.label}</dt><dd>{s.value}</dd></div>))}</dl>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {related.length > 0 && (
        <section className="light-section pb-24" aria-labelledby="rel-h">
          <div className="container">
            <div className="mb-8 flex items-end justify-between gap-6"><h2 id="rel-h" className="text-h3 font-medium">Vous aimerez aussi</h2><Link href="/boutique" className="xp-link">Toute la boutique <span aria-hidden="true">→</span></Link></div>
            <ul className="shop-grid">{related.map((r) => (<li key={r.slug}><ShopCard p={r} /></li>))}</ul>
          </div>
        </section>
      )}
    </>
  );
}

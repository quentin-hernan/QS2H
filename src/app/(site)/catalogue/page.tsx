import Link from "next/link";
import Image from "next/image";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { getPage, getProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Catalogue : licences, logiciels et produits numériques",
  description: "Licences et produits numériques proposés par QS2H, avec prix clairs et accompagnement à l'installation. Demande de devis en ligne.",
  path: "/catalogue",
});

export default async function Catalogue() {
  const [products, cp] = await Promise.all([getProducts(), getPage("catalogue")]);
  const cats = Array.from(new Set(products.map((p) => p.category || "Autres")));
  return (
    <>
      <PageHero eyebrow="Catalogue" title={<>Licences et produits, <span className="serif-it">clairs et accompagnés.</span></>} lead="Un prix lisible, une installation prise en charge, un interlocuteur unique. Demandez le produit qui vous intéresse : nous vous répondons sous 24 heures ouvrées.">
        <Breadcrumbs items={[{ name: "Catalogue", path: "/catalogue" }]} />
      </PageHero>

      <section className="light-section py-20 md:py-28" aria-label="Catalogue">
        <div className="container">
          {products.length === 0 ? (
            <p className="muted">Le catalogue arrive bientôt.</p>
          ) : (
            cats.map((cat) => (
              <div key={cat} className="mb-16 last:mb-0">
                {cats.length > 1 && <h2 className="mb-8 text-h3 font-medium">{cat}</h2>}
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.filter((p) => (p.category || "Autres") === cat).map((p, i) => (
                    <li key={p.id}>
                      <Reveal delay={(i % 3) * 0.06} className="h-full">
                        <Link href={`/catalogue/${p.slug}`} className="product-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border hair bg-white" data-cursor="Voir">
                          <div className="relative aspect-[4/3] overflow-hidden bg-ivory-200">
                            {p.image ? <Image src={p.image} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 95vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center font-serif text-5xl muted" aria-hidden="true">{p.title.slice(0, 1)}</span>}
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <h3 className="text-h3 font-medium">{p.title}</h3>
                            <p className="muted mt-2 flex-1 text-[0.97rem] leading-snug">{p.tagline}</p>
                            <p className="mt-6 text-lg font-medium">{p.price}<span className="muted ml-2 text-sm font-normal">{p.priceNote}</span></p>
                          </div>
                        </Link>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
      {((cp.media ?? []) as MediaItemT[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <CtaBand title="Un produit à demander ?" text="Indiquez ce dont vous avez besoin, nous vous répondons avec un prix et un délai d'installation." />
    </>
  );
}

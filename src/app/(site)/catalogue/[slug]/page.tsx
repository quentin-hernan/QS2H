import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CtaBand } from "@/components/Blocks";
import { getProduct, getProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.seoTitle || `${p.title} : ${p.category || "catalogue"} QS2H`, description: p.seoDescription || p.tagline, path: `/catalogue/${p.slug}` });
}

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  return (
    <>
      <section className="dark-section pb-20 pt-40 md:pb-28 md:pt-48" aria-labelledby="p-h">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Breadcrumbs items={[{ name: "Catalogue", path: "/catalogue" }, { name: p.title, path: `/catalogue/${p.slug}` }]} />
            {p.category && <p className="eyebrow mb-6">{p.category}</p>}
            <h1 id="p-h" className="text-h1 font-medium">{p.title}</h1>
            <p className="muted mt-6 max-w-xl text-[1.15rem] leading-relaxed">{p.tagline}</p>
            <p className="mt-10 text-[2.6rem] font-medium leading-none">{p.price}<span className="muted ml-3 text-base font-normal">{p.priceNote}</span></p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/contact?formule=${encodeURIComponent(p.title)}`} className="btn btn-primary btn-fill"><span>Demander ce produit</span></Link>
              <Link href="/catalogue" className="btn btn-outline">Retour au catalogue</Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            {p.image && <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem]"><Image src={p.image} alt={p.title} fill priority sizes="(min-width:1024px) 45vw, 95vw" className="object-cover" /></div>}
          </div>
        </div>
      </section>
      <section className="light-section py-20 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-12">
          {p.description && <div className="lg:col-span-7"><h2 className="mb-6 text-h3 font-medium">Présentation</h2><p className="max-w-prose whitespace-pre-line text-[1.08rem] leading-[1.75]">{p.description}</p></div>}
          {p.features.length > 0 && (
            <div className="lg:col-span-5"><h2 className="mb-6 text-h3 font-medium">Ce qui est inclus</h2>
              <ul className="space-y-3">{p.features.map((f) => (<li key={f} className="flex gap-3"><span className="acc" aria-hidden="true">✓</span>{f}</li>))}</ul>
            </div>
          )}
        </div>
      </section>
      <CtaBand title="Une question avant de commander ?" text="Écrivez-nous ou réservez un échange : nous vous conseillons sans engagement." />
    </>
  );
}

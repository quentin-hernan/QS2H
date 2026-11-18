import Link from "next/link";
import { Reveal } from "../Reveal";
import { WordReveal } from "../Motion";
import { ShopCard, type ShopCardItem } from "./ShopCard";

/** Accueil : « Visitez notre boutique » avec les articles du moment (mis en avant, sinon les plus récents). */
export function ShopTeaser({ items, title, text }: { items: (ShopCardItem & Record<string, unknown>)[]; title: string; text: string }) {
  if (!items.length) return null;
  const featured = items.filter((p) => p.featured);
  const pick = (featured.length ? featured : items).slice(0, 4);
  return (
    <section className="light-section py-24 md:py-32" aria-labelledby="shop-teaser-h">
      <div className="container">
        <div className="mb-12 grid items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="eyebrow mb-5">Boutique</p>
            <h2 id="shop-teaser-h" className="text-display font-medium"><WordReveal text={title} step={80} /></h2>
          </div>
          <div className="md:col-span-5">
            {text && <p className="muted text-[1rem] leading-relaxed">{text}</p>}
            <Link href="/boutique" className="btn btn-primary btn-fill btn-arrow mt-6"><span>Visiter la boutique</span><span aria-hidden="true" className="arr">→</span></Link>
          </div>
        </div>
        <ul className="shop-grid">
          {pick.map((p, i) => (<li key={p.slug}><Reveal delay={i * 0.08}><ShopCard p={p} /></Reveal></li>))}
        </ul>
      </div>
    </section>
  );
}

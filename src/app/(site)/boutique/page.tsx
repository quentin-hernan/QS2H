import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShopGrid } from "@/components/shop/ShopCard";
import { WordReveal } from "@/components/Motion";
import { CartRoll } from "@/components/Scenes";
import { getShopItems } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Boutique : matériel, logiciels et solutions clés en main",
  description: "La boutique QS2H : matériel informatique, logiciels, licences et prestations packagées, avec conseil et installation. Commande en ligne, facturation après confirmation.",
  path: "/boutique",
});

export default async function Boutique() {
  const items = await getShopItems();
  const cards = items.map(({ slug, title, tagline, category, brand, price, comparePrice, stock, badge, image, images, isExample, featured, order, features }) => ({ slug, title, tagline, category, brand, price, comparePrice, stock, badge, image, images, isExample, featured, order, features }));
  return (
    <>
      <section className="light-section pb-10 pt-32 md:pt-40" aria-labelledby="shop-h">
        <div className="container">
          <Breadcrumbs items={[{ name: "Boutique", path: "/boutique" }]} />
          <div className="mt-6 grid items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-7"><h1 id="shop-h" className="text-h1 font-medium"><WordReveal text="La boutique QS2H." auto step={90} /></h1><CartRoll /></div>
            <p className="muted text-[1.05rem] leading-relaxed md:col-span-5">Matériel, logiciels et solutions clés en main, choisis et installés par nos soins. Commandez en ligne : nous confirmons la disponibilité et vous envoyons la facture, sans paiement à l&apos;avance.</p>
          </div>
          <ul className="shop-perks">
            <li><strong>Conseil inclus</strong><span>Un doute ? Nous vous orientons avant l&apos;achat.</span></li>
            <li><strong>Installation possible</strong><span>Sur place à La Rochelle ou à distance.</span></li>
            <li><strong>Paiement à réception de facture</strong><span>Aucune carte demandée sur le site.</span></li>
          </ul>
        </div>
      </section>
      <section className="light-section pb-24 md:pb-32" aria-label="Articles">
        <div className="container">
          {cards.length ? <ShopGrid items={cards} /> : <p className="muted py-20 text-center">La boutique ouvre bientôt.</p>}
        </div>
      </section>
    </>
  );
}

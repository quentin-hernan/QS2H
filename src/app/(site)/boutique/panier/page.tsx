import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CartPage } from "@/components/shop/Checkout";

export const metadata = { title: "Panier", robots: { index: false } };

export default function Panier() {
  return (
    <section className="light-section pb-24 pt-32 md:pt-40">
      <div className="container">
        <Breadcrumbs items={[{ name: "Boutique", path: "/boutique" }, { name: "Panier", path: "/boutique/panier" }]} />
        <h1 className="mb-10 mt-6 text-h1 font-medium">Votre panier</h1>
        <CartPage />
      </div>
    </section>
  );
}

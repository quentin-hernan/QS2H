import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "@/components/shop/Checkout";

export const metadata = { title: "Commande", robots: { index: false } };

export default function Commande() {
  return (
    <section className="light-section pb-24 pt-32 md:pt-40">
      <div className="container">
        <Breadcrumbs items={[{ name: "Boutique", path: "/boutique" }, { name: "Commande", path: "/boutique/commande" }]} />
        <h1 className="mb-10 mt-6 text-h1 font-medium">Finaliser la commande</h1>
        <CheckoutForm />
      </div>
    </section>
  );
}

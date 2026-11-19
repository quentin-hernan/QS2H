import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { getClient } from "@/lib/client-auth";

export const metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Commande() {
  // un compte client est obligatoire pour commander (suivi de la commande dans l'espace client)
  const c = await getClient();
  if (!c) redirect("/compte/connexion?next=/boutique/commande");
  return (
    <section className="light-section pb-24 pt-32 md:pt-40">
      <div className="container">
        <Breadcrumbs items={[{ name: "Boutique", path: "/boutique" }, { name: "Commande", path: "/boutique/commande" }]} />
        <h1 className="mb-10 mt-6 text-h1 font-medium">Finaliser la commande</h1>
        <CheckoutForm account={{ name: `${c.firstName} ${c.lastName}`.trim(), email: c.email, company: c.company, phone: c.phone }} />
      </div>
    </section>
  );
}

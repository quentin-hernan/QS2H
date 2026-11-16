import { PageHero } from "@/components/Blocks";
import { ForgotForm } from "@/components/ClientForms";

export const metadata = { title: "Mot de passe oublié" };
export default function Page() {
  return (
    <>
      <PageHero eyebrow="Espace client" title="Mot de passe oublié" lead="Indiquez l'adresse de votre compte : si elle existe, vous recevrez un lien valable une heure." />
      <section className="light-section py-16 md:py-24"><div className="container"><div className="max-w-xl"><ForgotForm /></div></div></section>
    </>
  );
}

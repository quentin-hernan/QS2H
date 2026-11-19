import { redirect } from "next/navigation";
import { PageHero } from "@/components/Blocks";
import { LoginForm } from "@/components/ClientForms";
import { GoogleButton } from "@/components/GoogleButton";
import { safeNext } from "@/lib/shop";
import { getClient } from "@/lib/client-auth";

export const metadata = { title: "Connexion à l'espace client" };
export default async function Page({ searchParams }: { searchParams: Promise<{ reset?: string; erreur?: string; google?: string; next?: string }> }) {
  const q = await searchParams;
  const next = safeNext(q.next);
  if (await getClient()) redirect(next || "/compte");
  return (
    <>
      <PageHero eyebrow="Espace client" title="Connexion" />
      <section className="light-section py-16 md:py-24"><div className="container"><div className="max-w-xl">{q.erreur && <p role="alert" className="err mb-5 border p-3" style={{ borderColor: "currentColor" }}>La connexion avec Google a échoué. Réessayez ou utilisez votre email.</p>}{next && <p className="muted mb-5">Connectez-vous (ou créez un compte) pour continuer : un compte est nécessaire pour passer commande et suivre vos achats.</p>}<GoogleButton next={next} /><LoginForm reset={q.reset === "1"} next={next} /></div></div></section>
    </>
  );
}

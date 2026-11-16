import Link from "next/link";
import { PageHero } from "@/components/Blocks";
import { confirmNewsletter } from "../../../compte/actions";

export const metadata = { title: "Confirmation d'inscription", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const ok = await confirmNewsletter((await params).token);
  return (
    <>
      <PageHero eyebrow="Actualités" title={ok ? "Inscription confirmée" : "Lien invalide ou déjà utilisé"} lead={ok ? "Merci. Chaque email contient un lien pour vous désinscrire en un clic." : "Refaites votre demande depuis votre espace client."} />
      <section className="light-section py-16"><div className="container"><Link className="btn btn-primary" href="/">Retour à l&apos;accueil</Link></div></section>
    </>
  );
}

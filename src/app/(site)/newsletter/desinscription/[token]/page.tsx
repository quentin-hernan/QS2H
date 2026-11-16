import Link from "next/link";
import { PageHero } from "@/components/Blocks";
import { unsubscribeNewsletter } from "../../../compte/actions";

export const metadata = { title: "Désinscription", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const ok = await unsubscribeNewsletter((await params).token);
  return (
    <>
      <PageHero eyebrow="Actualités" title={ok ? "Vous êtes désinscrit(e)" : "Lien invalide"} lead={ok ? "Vous ne recevrez plus nos actualités." : "Ce lien de désinscription n'est pas reconnu. Écrivez-nous et nous le ferons pour vous."} />
      <section className="light-section py-16"><div className="container"><Link className="btn btn-primary" href="/">Retour à l&apos;accueil</Link></div></section>
    </>
  );
}

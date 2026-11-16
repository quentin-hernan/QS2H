import Link from "next/link";
import { PageHero } from "@/components/Blocks";
import { verifyEmail } from "../../actions";

export const metadata = { title: "Vérification de l'adresse email" };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const ok = await verifyEmail((await params).token);
  return (
    <>
      <PageHero eyebrow="Espace client" title={ok ? "Adresse vérifiée" : "Lien invalide ou expiré"} lead={ok ? "Votre compte est actif. Vous pouvez vous connecter." : "Ce lien a expiré ou a déjà été utilisé. Créez un compte à nouveau ou contactez-nous."} />
      <section className="light-section py-16"><div className="container"><Link className="btn btn-primary" href={ok ? "/compte/connexion" : "/compte/inscription"}>{ok ? "Me connecter" : "Créer un compte"}</Link></div></section>
    </>
  );
}

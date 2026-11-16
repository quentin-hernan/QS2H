import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/Blocks";
import { confirmDeletion } from "../../actions";

export const metadata = { title: "Suppression du compte" };
export const dynamic = "force-dynamic";

/** La suppression exige un clic explicite : un simple chargement du lien (antivirus, aperçu de messagerie) ne doit rien effacer. */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ fait?: string }> }) {
  const { token } = await params;
  const done = (await searchParams).fait === "1";
  async function confirm() {
    "use server";
    const ok = await confirmDeletion(token);
    redirect(`/compte/suppression/${ok ? "termine" : token}?fait=${ok ? "1" : "0"}`);
  }
  if (done) {
    return (
      <>
        <PageHero eyebrow="Espace client" title="Compte supprimé" lead="Vos données ont été effacées. Seules les factures sont conservées 10 ans, conformément à la loi." />
        <section className="light-section py-16"><div className="container"><Link className="btn btn-primary" href="/">Retour à l&apos;accueil</Link></div></section>
      </>
    );
  }
  return (
    <>
      <PageHero eyebrow="Espace client" title="Confirmer la suppression" lead="Cette action est définitive : compte, messages et demandes seront effacés. Les factures sont conservées 10 ans sans lien avec votre compte." />
      <section className="light-section py-16">
        <div className="container flex flex-wrap items-center gap-4">
          <form action={confirm}><button className="btn btn-primary">Supprimer définitivement mon compte</button></form>
          <Link className="btn btn-ghost" href="/compte">Annuler</Link>
          {(await searchParams).fait === "0" && <p role="alert" className="err">Lien invalide ou expiré. Refaites la demande depuis « Mes données et mes droits ».</p>}
        </div>
      </section>
    </>
  );
}

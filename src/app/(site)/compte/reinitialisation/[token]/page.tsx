import { PageHero } from "@/components/Blocks";
import { ResetForm } from "@/components/ClientForms";

export const metadata = { title: "Nouveau mot de passe" };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <PageHero eyebrow="Espace client" title="Choisir un nouveau mot de passe" />
      <section className="light-section py-16 md:py-24"><div className="container"><div className="max-w-xl"><ResetForm token={token} /></div></div></section>
    </>
  );
}

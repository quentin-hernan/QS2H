import { PageHero } from "@/components/Blocks";
import { GoogleButton } from "@/components/GoogleButton";
import { RegisterForm } from "@/components/ClientForms";

export const metadata = { title: "Créer un compte client" };
export default function Page() {
  return (
    <>
      <PageHero eyebrow="Espace client" title="Créer mon compte" lead="Suivez vos demandes et vos projets, retrouvez vos documents et échangez avec nous au même endroit." />
      <section className="light-section py-16 md:py-24"><div className="container"><div className="max-w-xl"><GoogleButton /><RegisterForm /></div></div></section>
    </>
  );
}

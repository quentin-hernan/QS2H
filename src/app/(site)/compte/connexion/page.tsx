import { redirect } from "next/navigation";
import { PageHero } from "@/components/Blocks";
import { LoginForm } from "@/components/ClientForms";
import { getClient } from "@/lib/client-auth";

export const metadata = { title: "Connexion à l'espace client" };
export default async function Page({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getClient()) redirect("/compte");
  const q = await searchParams;
  return (
    <>
      <PageHero eyebrow="Espace client" title="Connexion" />
      <section className="light-section py-16 md:py-24"><div className="container"><div className="max-w-xl"><LoginForm reset={q.reset === "1"} /></div></div></section>
    </>
  );
}

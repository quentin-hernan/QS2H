import { MediaBand } from "@/components/MediaBand";
import { MethodDevice } from "@/components/Scenes";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Timeline } from "@/components/Timeline";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Notre méthode : de l'audit à la mise en ligne de votre site",
  description: "Audit, cadrage, maquette, développement, recette, mise en ligne, suivi : les sept étapes de création d'un site web chez QS2H, avec durées indicatives.",
  path: "/methode",
});

export default async function Methode() {
  const m = await getPage("method");
  return (
    <>
      <PageHero image={m.heroImage || ""} eyebrow="Méthode" title={m.title} lead={m.intro}>
        <Breadcrumbs items={[{ name: "Méthode", path: "/methode" }]} />
      </PageHero>
      <section className="light-section py-24 md:py-36">
        <div className="container grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]"><div id="method-steps"><Timeline steps={m.steps} /></div><div className="hidden lg:block"><MethodDevice target="method-steps" /></div></div>
      </section>
      {((m.media ?? []) as { src?: string; alt?: string; title?: string; text?: string }[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <CtaBand title="Première étape : un échange." text="Décrivez votre projet. Nous vous répondons sous 24 heures ouvrées pour fixer un rendez-vous de cadrage." />
    </>
  );
}

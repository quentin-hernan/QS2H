import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { getFaqs } from "@/lib/content";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ : prix, délais, propriété, référencement de votre site web",
  description: "Toutes les réponses à vos questions sur la création de site web : combien ça coûte, en combien de temps, qui est propriétaire du site, comment est-il référencé.",
  path: "/faq",
});

export default async function FaqPage() {
  const items = (await getFaqs()).map((f) => ({ q: f.question, a: f.answer }));
  return (
    <>
      <JsonLd data={faqJsonLd(items)} />
      <PageHero eyebrow="FAQ" title={<>Vos questions, <span className="serif-it">nos réponses.</span></>} lead="Prix, délais, propriété du site, référencement : l'essentiel de ce que l'on nous demande avant de commencer.">
        <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
      </PageHero>
      <section className="light-section py-20 md:py-28"><div className="container max-w-4xl"><Faq items={items} /></div></section>
      <CtaBand title="Une autre question ?" text="Écrivez-nous : nous répondons sous 24 heures ouvrées." />
    </>
  );
}

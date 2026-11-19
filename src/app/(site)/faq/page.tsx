import { PageHero, CtaBand } from "@/components/Blocks";
import { FaqScene } from "@/components/Scenes";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { HomeFaq } from "@/components/HomeInteractive";
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
      <PageHero eyebrow="FAQ" title={<>Vos questions, <span className="serif-it">nos réponses.</span></>} lead="Prix, délais, propriété du site, référencement : l'essentiel de ce que l'on nous demande avant de commencer." art={<FaqScene />}>
        <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
      </PageHero>
      <HomeFaq items={items} title="Questions fréquentes" aside={<p className="muted max-w-xs leading-relaxed">Une question absente de cette liste ? <Link href="/contact" className="acc underline">Écrivez-nous</Link> ou <Link href="/rendez-vous" className="acc underline">prenez rendez-vous</Link>.</p>} />
      <CtaBand title="Une autre question ?" text="Écrivez-nous : nous répondons sous 24 heures ouvrées." />
    </>
  );
}

import Link from "next/link";
import { PlanDevices } from "@/components/Scenes";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { MediaBand, type MediaItemT } from "@/components/MediaBand";
import { getFaqs, getPage, getPlans } from "@/lib/content";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tarifs : création de site web à prix fixe",
  description: "Trois formules claires pour créer votre site : Essentiel dès 990 € HT, Professionnel 2 490 € HT, Sur mesure sur devis. Devis gratuit sous 24 h ouvrées.",
  path: "/tarifs",
});

export default async function Tarifs() {
  const [{ plans, options }, faqs, tp] = await Promise.all([getPlans(), getFaqs(), getPage("pricing")]);
  const f = faqs.slice(0, 3).map((x) => ({ q: x.question, a: x.answer }));
  return (
    <>
      <JsonLd data={faqJsonLd(f)} />
      <PageHero image={tp.heroImage || ""} eyebrow="Tarifs" title={<>Un prix fixe, <span className="serif-it">écrit d&apos;avance.</span></>} lead="Trois formules pour la plupart des projets. Le devis est gratuit, sous 24 heures ouvrées, et le prix ne change pas en cours de route.">
        <Breadcrumbs items={[{ name: "Tarifs", path: "/tarifs" }]} />
      </PageHero>

      <section className="light-section py-20 md:py-28">
        <div className="container">
          <PlanDevices names={plans.map((p) => p.name)} />
          <div className="plans grid gap-5 lg:grid-cols-3">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <article data-plan={i} className={`plan flex h-full flex-col rounded-[2rem] border p-8 md:p-10 ${p.highlighted ? "dark-section border-transparent shadow-[0_40px_80px_-40px_rgba(12,14,17,.7)]" : "hair"}`}>
                  <p className="acc mb-3 min-h-[1.2em] text-[0.75rem] font-medium uppercase tracking-[0.16em]">{p.highlighted ? "Le plus demandé" : ""}</p>
                  <h2 className="text-h3 font-medium">{p.name}</h2>
                  <p className="muted mt-2 min-h-[3em] text-[0.95rem] leading-snug">{p.description}</p>
                  <p className="mt-8 text-[3.4rem] font-medium leading-none tracking-tight">{p.price}<span className="muted ml-2 text-base font-normal tracking-normal">{p.priceNote}</span></p>
                  <ul className="mt-8 flex-1 space-y-3 border-t hair pt-6">
                    {p.features.map((x) => (<li key={x} className="flex gap-3 text-[0.97rem]"><span className="acc" aria-hidden="true">✓</span>{x}</li>))}
                  </ul>
                  <Link href={`/contact?formule=${encodeURIComponent(p.name)}`} className={`btn mt-10 ${p.highlighted ? "btn-primary" : "btn-ghost"}`}>{p.cta}</Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ivory-200 py-20 text-ink-900 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow mb-6">Options</p><h2 className="text-h2 font-medium">À ajouter selon vos besoins.</h2></div>
          <div className="lg:col-span-8">
            <table className="w-full text-left"><caption className="sr-only">Options et tarifs</caption>
              <thead className="sr-only"><tr><th>Option</th><th>Tarif</th></tr></thead>
              <tbody>
                {options.map((o) => (
                  <tr key={o.id} className="opt-row border-t hair last:border-b align-top">
                    <th scope="row" className="py-6 pr-6 font-medium"><span className="block text-[1.15rem]">{o.name}</span><span className="muted mt-1 block max-w-[44ch] text-[0.93rem] font-normal">{o.description}</span></th>
                    <td className="whitespace-nowrap py-6 text-right text-[1.1rem]">{o.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted mt-8 text-[0.9rem]">Prix hors taxes. Règlement en deux fois pour les projets standard : 40 % à la signature, solde à la livraison.</p>
          </div>
        </div>
      </section>

      <section className="light-section py-20 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow mb-6">Questions</p><h2 className="text-h2 font-medium">Sur les prix.</h2></div>
          <div className="lg:col-span-8"><Faq items={f} /></div>
        </div>
      </section>
      {((tp.media ?? []) as MediaItemT[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <CtaBand title="Votre devis, sous 24 h." text="Décrivez votre projet en quelques lignes : budget, délai, objectifs. Nous revenons vers vous avec un prix fixe." />
    </>
  );
}

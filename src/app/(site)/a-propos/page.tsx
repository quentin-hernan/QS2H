import Image from "next/image";
import { PageHero, CtaBand } from "@/components/Blocks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Tilt } from "@/components/BlogList";
import { Reveal } from "@/components/Reveal";
import { getPage, getTeam } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "À propos : une agence web à taille humaine à Bordeaux",
  description: "QS2H, agence de création de sites web installée à Bordeaux : notre histoire, nos valeurs, notre équipe et nos engagements de délais, de propriété et de transparence.",
  path: "/a-propos",
});

export default async function About() {
  const [a, team] = await Promise.all([getPage("about"), getTeam()]);
  const paras = String(a.story).split(/\n\s*\n/);
  return (
    <>
      <PageHero eyebrow="À propos" title={a.title} lead={a.intro}><Breadcrumbs items={[{ name: "À propos", path: "/a-propos" }]} /></PageHero>

      <section className="light-section py-20 md:py-32">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow mb-6">Notre histoire</p></div>
          <div className="space-y-6 lg:col-span-7">{paras.map((p, i) => (<Reveal key={i}><p className={i === 0 ? "font-serif text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.25]" : "prose-qs"}>{p}</p></Reveal>))}</div>
        </div>
      </section>

      <section className="dark-section py-20 md:py-32">
        <div className="container">
          <p className="eyebrow mb-12">Valeurs</p>
          <div className="grid gap-px md:grid-cols-3">
            {a.values.map((v: { title: string; text: string }, i: number) => (
              <Reveal key={v.title} delay={i * 0.08}><div className="border-t hair pr-8 pt-8"><h2 className="serif-it text-5xl">{v.title}</h2><p className="muted mt-5 max-w-[34ch] leading-relaxed">{v.text}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="light-section py-20 md:py-32">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><p className="eyebrow mb-6">Équipe</p><h2 className="text-h2 font-medium">Qui vous répond.</h2></div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            {team.map((m, i) => (
              <Reveal as="li" key={m.id} delay={i * 0.08}>
                <Tilt><div className="relative mb-5 aspect-[4/5] overflow-hidden chamfer bg-ivory-200 shadow-[0_30px_40px_-30px_rgba(28,28,28,.5)]">{m.photo ? <Image src={m.photo} alt={`Portrait de ${m.name}`} fill sizes="(min-width:640px) 30vw, 90vw" className="object-cover" /> : <div className="flex h-full items-center justify-center font-serif text-7xl muted">{m.name.replace(/[\[\]]/g, "").slice(0, 1)}</div>}</div></Tilt>
                <h3 className="text-h3 font-medium">{m.name}</h3><p className="acc text-[0.9rem]">{m.role}</p><p className="muted mt-3 leading-relaxed">{m.bio}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ivory-200 py-20 text-ink-900 md:py-32">
        <div className="container">
          <p className="eyebrow mb-12">Engagements</p>
          <ul className="grid gap-px md:grid-cols-3">
            {a.commitments.map((c: { title: string; text: string }, i: number) => (
              <Reveal as="li" key={c.title} delay={i * 0.08}><div className="hair h-full border-t pr-8 pt-8"><p className="muted text-[0.85rem] tabular-nums">0{i + 1}</p><h2 className="mt-6 text-h3 font-medium">{c.title}</h2><p className="muted mt-3 leading-relaxed">{c.text}</p></div></Reveal>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand title="Travaillons ensemble." text="Un échange de 30 minutes suffit pour savoir si nous pouvons vous aider." />
    </>
  );
}

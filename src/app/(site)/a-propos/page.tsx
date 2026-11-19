import { MediaBand } from "@/components/MediaBand";
import { ImgSlot } from "@/components/ImgSlot";
import { PageHero, CtaBand } from "@/components/Blocks";
import { AboutScene } from "@/components/Scenes";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Tilt } from "@/components/BlogList";
import { Reveal } from "@/components/Reveal";
import { TeamTools } from "@/components/TeamTools";
import { getPage, getTeam } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, simplePageJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "À propos : une agence web à taille humaine à La Rochelle",
  description: "QS2H, agence de création de sites web installée à La Rochelle : notre histoire, nos valeurs, notre équipe et nos engagements de délais, de propriété et de transparence.",
  path: "/a-propos",
});

export default async function About() {
  const [a, team] = await Promise.all([getPage("about"), getTeam()]);
  const paras = String(a.story).split(/\n\s*\n/);
  return (
    <>
      <JsonLd data={simplePageJsonLd("AboutPage", { name: "À propos de QS2H", description: "Agence de création de sites web à La Rochelle : histoire, valeurs, équipe et engagements.", path: "/a-propos" })} />
      <PageHero image={a.heroImage || ""} art={<AboutScene />} eyebrow="À propos" title={a.title} lead={a.intro}><Breadcrumbs items={[{ name: "À propos", path: "/a-propos" }]} /></PageHero>

      <section className="light-section py-20 md:py-32">
        <div className="container">
        <p className="eyebrow mb-8">Notre histoire</p>
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Reveal className="lg:sticky lg:top-28">
              <div className="story-panel">
                {a.storyPanel ? (/\.(mp4|webm|mov|ogv)(\?|$)/i.test(a.storyPanel)
                  ? <video src={a.storyPanel} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                  : /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.storyPanel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />) : <span className="story-panel-bg" aria-hidden="true" />}
                <span className="absolute inset-0 bg-[#0E1013]" style={{ opacity: Math.min(90, Math.max(0, Number(a.storyPanelDim) || 0)) / 100 }} aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between p-7">
                  {a.storyPanelKicker && <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] opacity-80">{a.storyPanelKicker}</p>}
                  <div>
                    {a.storyPanelTitle && <p className="font-serif text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.1]">{a.storyPanelTitle}</p>}
                    {a.storyPanelText && <p className="mt-3 text-[0.95rem] leading-relaxed opacity-80">{a.storyPanelText}</p>}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="space-y-6 lg:col-span-7 lg:col-start-6">{paras.map((p, i) => (<Reveal key={i}><p className={i === 0 ? "-mt-[0.18em] font-serif text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.25]" : "prose-qs"}>{p}</p></Reveal>))}</div>
        </div>
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
                <Tilt><ImgSlot id={`team-${m.id}`} src={m.photo} alt={`Portrait de ${m.name}`} className="relative mb-5 block aspect-[4/5] overflow-hidden chamfer bg-ivory-200 shadow-[0_30px_40px_-30px_rgba(28,28,28,.5)]"><span className="flex h-full items-center justify-center font-serif text-7xl muted">{m.name.replace(/[\[\]]/g, "").slice(0, 1)}</span></ImgSlot></Tilt>
                <h3 className="text-h3 font-medium">{m.name}</h3><p className="acc text-[0.9rem]">{m.role}</p><p className="muted mt-3 leading-relaxed">{m.bio}</p>
              </Reveal>
            ))}
          </ul>
          <div className="lg:col-span-12"><TeamTools members={team.map((m) => ({ id: m.id, name: m.name, role: m.role, bio: m.bio }))} /></div>
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
      {((a.media ?? []) as { src?: string; alt?: string; title?: string; text?: string }[]).map((it, i) => (<MediaBand key={i} item={it} tone={i % 2 ? "dark" : "light"} />))}
      <CtaBand title="Travaillons ensemble." text="Un échange de 30 minutes suffit pour savoir si nous pouvons vous aider." />
    </>
  );
}

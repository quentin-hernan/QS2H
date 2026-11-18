import Link from "next/link";
import Image from "next/image";
import { Lines, Reveal } from "./Reveal";
import { ScrollWords } from "./Motion";

type Item = { title: string; text: string };
type Proj = { slug: string; title: string; sector: string; summary: string; cover: string; isExample: boolean };

/* 02 · Présentation : une grande phrase, un texte court */
export function Intro({ line1, line2, text }: { line1: string; line2: string; text: string }) {
  return (
    <section className="light-section py-28 md:py-44" aria-label="Présentation de QS2H">
      <div className="container">
        <Lines as="h2" lines={[line1, <span key="b" className="text-mute-light">{line2}</span>]} className="max-w-[16ch] text-display font-medium" />
        <div className="mt-14 grid md:grid-cols-12"><ScrollWords text={text} className="text-[1.3rem] leading-[1.6] md:col-span-7 md:col-start-6" /></div>
      </div>
    </section>
  );
}

/* 05 · Réalisations : grands visuels, révélés par un masque au défilement */
export function Showcase({ projects, title }: { projects: Proj[]; title: string }) {
  if (!projects.length) return null;
  const [first, ...rest] = projects;
  const Card = ({ p, big }: { p: Proj; big?: boolean }) => (
    <Link href={`/realisations/${p.slug}`} className="sc-card group block" data-cursor="Voir">
      <div className={`sc-media ${big ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
        {p.cover ? <Image src={p.cover} alt={`Aperçu du site ${p.title}`} fill sizes={big ? "(min-width:1024px) 90vw, 100vw" : "(min-width:1024px) 45vw, 100vw"} className="object-cover" /> : null}
        {p.isExample && <span className="sc-badge">Projet concept</span>}
      </div>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="sc-title text-h3 font-medium">{p.title}</h3>
        <span className="muted text-sm">{p.sector}</span>
      </div>
      {big && <p className="muted mt-2 max-w-2xl">{p.summary}</p>}
    </Link>
  );
  return (
    <section className="light-section py-24 md:py-36" aria-labelledby="sc-h">
      <div className="container">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6"><h2 id="sc-h" className="text-h1 font-medium">{title}</h2><Link href="/realisations" className="xp-link">Toutes les réalisations <span aria-hidden="true">→</span></Link></div>
        <Reveal><Card p={first} big /></Reveal>
        {rest.length > 0 && <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">{rest.slice(0, 2).map((p, i) => (<Reveal key={p.slug} delay={i * 0.1}><Card p={p} /></Reveal>))}</div>}
      </div>
    </section>
  );
}

/* 07 · Pourquoi QS2H : titre fixe, affirmations numérotées */
export function Why({ title, items }: { title: string; items: Item[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-ivory-200 py-24 text-ink-900 md:py-36" aria-labelledby="why-h">
      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5"><div className="lg:sticky lg:top-32"><Lines id="why-h" as="h2" lines={[title]} className="text-display font-medium" /></div></div>
        <ol className="lg:col-span-7">
          {items.map((it, i) => (
            <li key={i} className="why-row">
              <Reveal>
                <p className="why-k" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="text-h2 font-medium">{it.title}</h3>
                <p className="muted mt-3 max-w-xl text-[1.08rem] leading-relaxed">{it.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 09 · Appel final */
export function FinalCta({ title, text, cta }: { title: string; text: string; cta: string }) {
  return (
    <section className="dark-section fc-sec relative overflow-hidden py-32 md:py-52" aria-labelledby="fc-h">
      <div className="container relative z-10">
        <Lines id="fc-h" as="h2" lines={[title]} className="fc-title max-w-[13ch] font-medium" />
        <span className="fc-rule" aria-hidden="true" />
        <div className="mt-12 grid items-end gap-8 md:grid-cols-2">
          <Reveal delay={0.15}><p className="muted max-w-md text-[1.15rem] leading-relaxed">{text}</p></Reveal>
          <Reveal delay={0.25}><div className="flex flex-wrap gap-3 md:justify-end"><Link href="/contact" className="btn btn-primary btn-fill btn-arrow"><span>{cta}</span><span aria-hidden="true" className="arr">→</span></Link><Link href="/rendez-vous" className="btn btn-ghost">Prendre rendez-vous</Link></div></Reveal>
        </div>
      </div>
    </section>
  );
}

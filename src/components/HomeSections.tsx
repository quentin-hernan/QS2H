import Link from "next/link";
import { Lines, Reveal } from "./Reveal";
import { ScrollWords, WordReveal } from "./Motion";
import { IntroArt, SweepLine } from "./HomeInteractive";

type Item = { title: string; text: string };

/* 02 · Présentation : une grande phrase, un texte court */
export function Intro({ line1, line2, text, bg = "" }: { line1: string; line2: string; text: string; bg?: string }) {
  const video = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(bg);
  return (
    <section className="light-section relative overflow-hidden py-28 md:py-44" aria-label="Présentation de QS2H">
      {bg ? (
        <>
          {video ? <video src={bg} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-ivory/80" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="ia-grid" aria-hidden="true" />
          <div className="ia-wrap hidden md:block"><IntroArt /></div>
        </>
      )}
      <div className="container relative z-10">
        <Reveal><span className="intro-rule" aria-hidden="true" /></Reveal>
        <h2 className="mt-6 max-w-[16ch] text-display font-medium">
          <span className="block"><WordReveal text={line1} step={90} /></span>
          <span className="block"><SweepLine>{line2}</SweepLine></span>
        </h2>
        <div className="mt-14 grid md:grid-cols-12"><ScrollWords text={text} className="text-[1.1rem] leading-[1.6] md:col-span-5" /></div>
        <div className="mt-14 md:hidden"><IntroArt /></div>
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
                <h3 className="text-h2 font-medium [font-size:clamp(1.25rem,2.1vw,1.9rem)]">{it.title}</h3>
                <p className="muted mt-3 max-w-xl text-[1rem] leading-relaxed">{it.text}</p>
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
          <Reveal delay={0.15}><p className="muted max-w-md text-[1.05rem] leading-relaxed">{text}</p></Reveal>
          <Reveal delay={0.25}><div className="flex flex-wrap gap-3 md:justify-end"><Link href="/contact" className="btn btn-primary btn-fill btn-arrow"><span>{cta}</span><span aria-hidden="true" className="arr">→</span></Link><Link href="/rendez-vous" className="btn btn-ghost">Prendre rendez-vous</Link></div></Reveal>
        </div>
      </div>
    </section>
  );
}

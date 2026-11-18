import Link from "next/link";
import { Reveal, Lines } from "./Reveal";
import { CountUp } from "./CountUp";
import { FrameDraw } from "./Motion";
import { euro } from "@/lib/utils";

export function TrustBar({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="light-section border-b hair" aria-label="Nos engagements">
      <div className="container grid gap-x-8 gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.07}>
            <p className="font-serif text-[3.2rem] leading-none tracking-tight"><CountUp value={it.value} /></p>
            <p className="muted mt-3 max-w-[22ch] text-[0.95rem] leading-snug">{it.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

type Svc = { slug: string; title: string; tagline: string; priceFrom: number; priceUnit: string };
export function ServicesList({ services, title, lead, theme = "light", bg = "" }: { services: Svc[]; title: string; lead: string; theme?: "light" | "dark"; bg?: string }) {
  const dark = theme === "dark" || !!bg;
  const video = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(bg);
  return (
    <section className={`${dark ? "dark-section" : "light-section"} relative overflow-hidden py-24 md:py-36`} aria-labelledby="services-h">
      {bg && (
        <>
          {video ? <video src={bg} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg} alt="" loading="lazy" decoding="async" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-ink-900/75" aria-hidden="true" />
        </>
      )}
      <div className="container relative z-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow mb-6">Services</p>
            <Lines id="services-h" as="h2" lines={[title]} className="text-h2 font-medium [&_.ln]:pb-2" />
            <Reveal delay={0.2}><p className="muted mt-6 max-w-sm leading-relaxed">{lead}</p></Reveal>
            <Reveal delay={0.3}><Link href="/services" className="btn btn-ghost mt-8">Tous les services</Link></Reveal>
          </div>
        </div>
        <ol className="lg:col-span-8">
          {services.map((s, i) => (
            <li key={s.slug} className="border-t hair last:border-b">
              <Link href={`/services/${s.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 gap-y-2 py-8 transition-[padding] duration-500 ease-out hover:pl-4 md:gap-x-10" data-cursor="Voir">
                <span className="muted w-8 text-[0.85rem] tabular-nums">0{i + 1}</span>
                <div>
                  <h3 id={i === 0 ? "services-h-first" : undefined} className="text-h3 font-medium transition-colors group-hover:acc">{s.title}</h3>
                  <p className="muted mt-2 max-w-[52ch] leading-snug">{s.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="muted text-[0.78rem] uppercase tracking-wider">à partir de</p>
                  <p className="text-lg font-medium">{euro(s.priceFrom)} <span className="muted text-[0.8rem] font-normal">{s.priceUnit.replace("€ ", "")}</span></p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type Rv = { id: string; author: string; role: string; company: string; rating: number; text: string; isExample: boolean };
export function Reviews({ reviews }: { reviews: Rv[] }) {
  if (!reviews.length) return null;
  const [first, ...rest] = reviews;
  return (
    <section className="light-section py-24 md:py-36" aria-labelledby="avis-h">
      <div className="container">
        <p className="eyebrow mb-10">Avis clients</p>
        <h2 id="avis-h" className="sr-only">Ce que disent nos clients</h2>
        <Reveal>
          <figure className="max-w-5xl">
            <blockquote className="font-serif text-[clamp(1.9rem,4vw,3.6rem)] leading-[1.1] tracking-tight">« {first.text} »</blockquote>
            <figcaption className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.95rem]">
              <span className="font-medium">{first.author}</span>
              <span className="muted">{[first.role, first.company].filter(Boolean).join(" · ")}</span>
              <Stars n={first.rating} />
              {first.isExample && <span className="muted border hair px-2.5 py-0.5 text-[0.72rem] uppercase tracking-wider">Avis d&apos;exemple</span>}
            </figcaption>
          </figure>
        </Reveal>
        {rest.length > 0 && (
          <div className="hair mt-20 grid gap-10 border-t pt-12 md:grid-cols-3">
            {rest.slice(0, 3).map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08}>
                <figure>
                  <Stars n={r.rating} />
                  <blockquote className="mt-4 leading-relaxed">« {r.text} »</blockquote>
                  <figcaption className="muted mt-4 text-[0.9rem]"><span className="font-medium text-ink-900">{r.author}</span> — {[r.role, r.company].filter(Boolean).join(", ")}{r.isExample ? " · exemple" : ""}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="acc inline-flex gap-0.5 text-[0.95rem]" role="img" aria-label={`${n} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (<span key={i} aria-hidden="true" style={{ opacity: i < n ? 1 : 0.25 }}>★</span>))}
    </span>
  );
}

export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="dark-section relative overflow-hidden py-28 md:py-44" aria-labelledby="cta-h">
      <FrameDraw className="container">
        <Lines id="cta-h" as="h2" lines={[title]} className="text-display max-w-[14ch] font-medium [&_.ln]:pb-3" />
        <div className="mt-10 grid items-end gap-8 md:grid-cols-2">
          <Reveal delay={0.2}><p className="muted max-w-md text-[1.15rem] leading-relaxed">{text}</p></Reveal>
          <Reveal delay={0.3}><div className="flex flex-wrap gap-3 md:justify-end"><Link href="/contact" className="btn btn-primary">Demander un devis gratuit <span aria-hidden="true">→</span></Link><Link href="/tarifs" className="btn btn-ghost">Voir les tarifs</Link></div></Reveal>
        </div>
      </FrameDraw>
    </section>
  );
}

export function PageHero({ eyebrow, title, lead, children, image = "", art, after }: { eyebrow: string; title: React.ReactNode; lead?: string; children?: React.ReactNode; image?: string; art?: React.ReactNode; after?: React.ReactNode }) {
  const video = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(image);
  const side = !!image || !!art;
  return (
    <section className="dark-section relative pb-20 pt-40 md:pb-28 md:pt-52" aria-label={typeof title === "string" ? title : eyebrow}>
      <FrameDraw className={`container ${side ? "grid items-center gap-12 lg:grid-cols-12" : ""}`}>
        <div className={side ? "lg:col-span-7" : ""}>
          {children}
          {eyebrow && <p className="eyebrow mb-7">{eyebrow}</p>}
          <h1 className={`text-h1 font-medium ${side ? "" : "max-w-[18ch]"}`}>{title}</h1>
          {lead && <p className="muted mt-8 max-w-2xl text-[1.2rem] leading-relaxed">{lead}</p>}
          {after}
        </div>
        {image ? (
          <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-ink-800 lg:col-span-5">
            {video ? <video src={image} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={image} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
          </div>
        ) : art ? <div className="hidden md:block lg:col-span-5">{art}</div> : null}
      </FrameDraw>
    </section>
  );
}

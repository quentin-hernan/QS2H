import Link from "next/link";
import { MediaBand } from "./MediaBand";
import { Lines, Reveal } from "./Reveal";
import { Faq } from "./Faq";
import { safeHref, type Item, type Section } from "@/lib/sections";

const isVideo = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);
const tone = (d: Section["d"]) => (d.tone === "dark" ? "dark-section" : "light-section");
const s = (v: unknown) => (typeof v === "string" ? v : "");

function Visual({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  return isVideo(src)
    ? <video src={src} muted loop playsInline autoPlay preload="metadata" aria-label={alt || undefined} className={`h-full w-full object-cover ${className}`} />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
}
function Btn({ label, href, primary = true }: { label: string; href: string; primary?: boolean }) {
  const h = safeHref(href);
  if (!label || !h) return null;
  const cls = `btn ${primary ? "btn-primary btn-fill" : "btn-outline"}`;
  return h.startsWith("/") ? <Link href={h} className={cls}><span>{label}</span></Link> : <a href={h} className={cls} {...(h.startsWith("https") ? { target: "_blank", rel: "noopener noreferrer" } : {})}><span>{label}</span></a>;
}

/** Affiche les sections d'une page libre (public et aperçu de l'éditeur). */
export function Sections({ sections, title }: { sections: Section[]; title: string }) {
  const hasHero = sections[0]?.type === "hero";
  return (
    <>
      {!hasHero && <h1 className="sr-only">{title}</h1>}
      {sections.map((sec, i) => {
        const d = sec.d;
        switch (sec.type) {
          case "hero":
            return (
              <section key={sec.id} className={`${d.tone === "light" ? "light-section" : "dark-section"} pb-20 pt-40 md:pb-28 md:pt-52`} aria-label={s(d.title) || title}>
                <div className={`container grid items-center gap-12 ${s(d.src) ? "lg:grid-cols-12" : ""}`}>
                  <div className={s(d.src) ? "lg:col-span-6" : "max-w-3xl"}>
                    {s(d.eyebrow) && <p className="eyebrow mb-7">{s(d.eyebrow)}</p>}
                    <h1 className="text-h1 font-medium">{s(d.title) || title}</h1>
                    {s(d.text) && <p className="muted mt-7 max-w-xl whitespace-pre-line text-[1.15rem] leading-relaxed">{s(d.text)}</p>}
                    <div className="mt-9"><Btn label={s(d.buttonLabel)} href={s(d.buttonHref)} /></div>
                  </div>
                  {s(d.src) && <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-ink-800 lg:col-span-6"><Visual src={s(d.src)} alt={s(d.alt)} /></div>}
                </div>
              </section>
            );
          case "text":
            return (
              <section key={sec.id} className={`${tone(d)} py-20 md:py-28`} aria-label={s(d.title) || "Texte"}>
                <div className={`container ${d.align === "center" ? "text-center" : ""}`}>
                  <div className={d.align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl"}>
                    {s(d.eyebrow) && <p className="eyebrow mb-6">{s(d.eyebrow)}</p>}
                    {s(d.title) && <Lines as="h2" lines={[s(d.title)]} className="text-h2 font-medium" />}
                    <div className="mt-8 space-y-5 text-[1.1rem] leading-[1.75]">{s(d.body).split(/\n\s*\n/).filter(Boolean).map((p, n) => (<Reveal key={n}><p className="whitespace-pre-line">{p}</p></Reveal>))}</div>
                  </div>
                </div>
              </section>
            );
          case "media":
            return <MediaBand key={sec.id} item={{ src: s(d.src), alt: s(d.alt), title: s(d.title), text: s(d.text) }} tone={d.tone === "dark" ? "dark" : "light"} />;
          case "columns": {
            const items = (Array.isArray(d.items) ? d.items : []) as Item[];
            const cols = items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
            return (
              <section key={sec.id} className={`${tone(d)} py-20 md:py-28`} aria-label={s(d.title) || "Colonnes"}>
                <div className="container">
                  {s(d.title) && <Lines as="h2" lines={[s(d.title)]} className="mb-12 max-w-3xl text-h2 font-medium" />}
                  <ul className={`grid gap-8 sm:grid-cols-2 ${cols}`}>
                    {items.map((it, n) => (
                      <li key={n}><Reveal delay={(n % 4) * 0.06} className="h-full">
                        {it.src && <div className="relative mb-5 aspect-video overflow-hidden rounded-[1.25rem] bg-ivory-200"><Visual src={it.src} alt={it.alt || ""} /></div>}
                        <h3 className="text-h3 font-medium">{it.title}</h3>
                        {it.text && <p className="muted mt-3 whitespace-pre-line leading-relaxed">{it.text}</p>}
                      </Reveal></li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }
          case "faq": {
            const items = ((Array.isArray(d.items) ? d.items : []) as Item[]).filter((x) => x.q);
            if (!items.length) return null;
            return (
              <section key={sec.id} className={`${tone(d)} py-20 md:py-28`} aria-label={s(d.title) || "Questions fréquentes"}>
                <div className="container grid gap-12 lg:grid-cols-12">
                  <div className="lg:col-span-4">{s(d.title) && <Lines as="h2" lines={[s(d.title)]} className="text-h2 font-medium" />}</div>
                  <div className="lg:col-span-8"><Faq items={items.map((x) => ({ q: x.q, a: x.a || "" }))} /></div>
                </div>
              </section>
            );
          }
          case "cta":
            return (
              <section key={sec.id} className={`${tone(d)} py-24 md:py-36`} aria-label={s(d.title) || "Contact"}>
                <div className="container">
                  <Lines as="h2" lines={[s(d.title)]} className="max-w-[18ch] text-h1 font-medium" />
                  <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
                    {s(d.text) && <Reveal><p className="muted max-w-md whitespace-pre-line text-[1.1rem] leading-relaxed">{s(d.text)}</p></Reveal>}
                    <Btn label={s(d.buttonLabel)} href={s(d.buttonHref)} />
                  </div>
                </div>
              </section>
            );
        }
      })}
    </>
  );
}

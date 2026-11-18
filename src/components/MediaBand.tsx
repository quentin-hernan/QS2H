"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lines, Reveal } from "./Reveal";

export type MediaItemT = { src?: string; alt?: string; title?: string; text?: string };
const isVideo = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);

/**
 * Grand visuel 16:9 (image ou vidéo) géré depuis l'admin. Rôle : respiration visuelle entre deux sections de texte.
 * Au scroll, le cadre s'ouvre (échelle et arrondi) ; la vidéo ne joue que lorsqu'elle est visible.
 */
export function MediaBand({ item, tone = "light" }: { item?: MediaItemT; tone?: "light" | "dark" }) {
  const frame = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const src = item?.src?.trim();

  useEffect(() => {
    const el = frame.current;
    if (!el || !src) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tween: gsap.core.Tween | undefined;
    if (!reduce) {
      gsap.registerPlugin(ScrollTrigger);
      tween = gsap.fromTo(el, { scale: 0.88, borderRadius: 40 }, { scale: 1, borderRadius: 14, ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: 0.6 } });
    }
    const v = vid.current;
    let io: IntersectionObserver | undefined;
    if (v) {
      if (reduce) v.removeAttribute("autoplay");
      else {
        io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 });
        io.observe(v);
      }
    }
    return () => { tween?.scrollTrigger?.kill(); tween?.kill(); io?.disconnect(); };
  }, [src]);

  if (!src) return null;
  return (
    <section className={`${tone === "dark" ? "dark-section" : "light-section"} py-12 md:py-20`} aria-label={item?.title || item?.alt || "Visuel"}>
      <div className="container">
        <div ref={frame} className="media-frame relative aspect-video w-full overflow-hidden bg-ink-800" style={{ borderRadius: 14 }}>
          {isVideo(src) ? (
            <video ref={vid} src={src} muted loop playsInline preload="metadata" aria-label={item?.alt || undefined} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={item?.alt || ""} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        {(item?.title || item?.text) && (
          <div className="mt-8 grid gap-4 md:grid-cols-12">
            {item?.title && <Lines as="h2" lines={[item.title]} className="text-h3 md:col-span-5" />}
            {item?.text && <Reveal className="muted max-w-prose md:col-span-6 md:col-start-7"><p>{item.text}</p></Reveal>}
          </div>
        )}
      </div>
    </section>
  );
}

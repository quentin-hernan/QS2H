"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/services", label: "Services", hint: "Site vitrine, sur mesure, refonte, e-commerce, SEO, maintenance." },
  { href: "/realisations", label: "Réalisations", hint: "Nos projets, ouverts comme des fenêtres de travail." },
  { href: "/tarifs", label: "Tarifs", hint: "Trois formules claires, prix fixes, devis sous 24 h ouvrées." },
  { href: "/methode", label: "Méthode", hint: "De l'audit à la mise en ligne, étape par étape." },
  { href: "/blog", label: "Blog", hint: "Conseils concrets pour votre site et votre référencement." },
  { href: "/a-propos", label: "À propos", hint: "Qui nous sommes, nos engagements." },
];

/** Barre d'en-tête : transparente en haut, floutée au scroll, claire ou sombre selon la section dessous, masquée en descendant. */
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (!open) {
        if (y < 240) setHidden(false);
        else if (y > last.current + 4) setHidden(true);
        else if (y < last.current - 4) setHidden(false);
      }
      last.current = y;
      // section sous la barre : sombre ou claire
      const el = document.elementFromPoint(window.innerWidth / 2, (y > 24 ? 60 : 76) + 6); // section juste sous la barre
      const sec = el?.closest("section, header, footer, main > div, [data-tone]") as HTMLElement | null;
      const tone = sec?.closest("[data-tone]")?.getAttribute("data-tone");
      setDark(tone ? tone === "dark" : !!sec?.closest(".dark-section"));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [open, path]);
  useEffect(() => { setOpen(false); setHidden(false); }, [path]);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), btn.current?.focus());
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const light = dark || open; // texte et logo clairs
  const bg = scrolled && !open ? (dark ? "bg-ink-900/80 border-b" : "bg-ivory/85 border-b") : "border-b border-transparent";
  const line = dark ? "rgb(248 248 247 / .14)" : "rgb(28 28 28 / .1)";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`} data-header>
        <div className={`${bg} backdrop-blur-md transition-[background-color,border-color,backdrop-filter] duration-300`} style={{ borderColor: scrolled && !open ? line : "transparent", color: light ? "#F8F8F7" : "#1C1C1C", ["--acc-ctx" as string]: light ? "var(--accent-hi)" : "var(--accent)" }}>
          <div className={`container flex max-w-[1440px] items-center justify-between transition-[height] duration-300 ease-out ${scrolled ? "h-[60px]" : "h-[76px]"}`}>
            <Link href="/" aria-label="QS2H — accueil" className="relative z-[60] block shrink-0">
              <Image src={light ? "/logo-light.png" : "/logo.png"} alt="QS2H, solutions digitales" width={720} height={227} sizes="160px" priority className={`w-auto transition-[height] duration-300 ${scrolled ? "h-9" : "h-11"}`} />
            </Link>
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
              {links.map((l) => {
                const active = path === l.href || path.startsWith(l.href + "/");
                return (
                  <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className="nav-link relative px-4 py-2 text-[0.92rem] font-medium" data-active={active}>
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="relative z-[60] flex items-center gap-3">
              <Link href="/compte" className="btn btn-outline hidden !min-h-[44px] !px-5 !py-2.5 text-[0.88rem] xl:inline-flex">Espace client</Link>
              <Link href="/contact" className="btn btn-primary btn-fill !min-h-[44px] !px-5 !py-2.5 text-[0.9rem]"><span className="sm:hidden">Devis</span><span className="hidden sm:inline">Demander un devis</span></Link>
              <button ref={btn} type="button" className="btn btn-outline !min-h-[44px] !px-4 !py-2.5 text-[0.88rem]" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>{open ? "Fermer" : "Menu"}</button>
            </div>
          </div>
        </div>
      </header>

      <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" hidden={!open} data-tone="dark" className={`dark-section fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto px-6 pb-10 pt-28 transition-opacity duration-500 md:px-16 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="grid flex-1 gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <nav aria-label="Navigation du menu" className="flex flex-col">
            {links.map((l, i) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onMouseLeave={() => setHover(null)} className="menu-row group flex items-baseline gap-5 border-b hair py-3 md:py-4">
                <span className="muted w-8 text-[0.8rem] tabular-nums tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                <span className="menu-mask"><span className="menu-text font-serif text-[clamp(2rem,6vw,4.4rem)] leading-[1.05]" style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms", transform: open ? "none" : "translateY(110%)" }}>{l.label}</span></span>
              </Link>
            ))}
          </nav>
          <aside className="hidden md:block" aria-hidden="true">
            <div className="chamfer relative flex min-h-[260px] flex-col justify-between border hair p-8">
              <span className="font-serif text-[7rem] leading-none" style={{ color: "rgb(var(--accent-hi))" }}>{String((hover ?? 0) + 1).padStart(2, "0")}</span>
              <p key={hover ?? 0} className="swap max-w-[28ch] text-lg">{links[hover ?? 0].hint}</p>
            </div>
          </aside>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary btn-fill"><span>Demander un devis gratuit</span></Link>
          <Link href="/compte" onClick={() => setOpen(false)} className="btn btn-outline">Espace client</Link>
        </div>
      </div>
    </>
  );
}

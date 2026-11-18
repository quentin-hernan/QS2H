"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/services", label: "Services", hint: "Site vitrine, sur mesure, refonte, e-commerce, SEO, maintenance." },
  { href: "/realisations", label: "Réalisations", hint: "Nos projets, ouverts comme des fenêtres de travail." },
  { href: "/tarifs", label: "Tarifs", hint: "Trois formules claires, prix fixes, devis sous 24 h ouvrées." },
  { href: "/methode", label: "Méthode", hint: "De l'audit à la mise en ligne, étape par étape." },
  { href: "/blog", label: "Blog", hint: "Conseils concrets pour votre site et votre référencement." },
  { href: "/a-propos", label: "À propos", hint: "Qui nous sommes, nos engagements." },
  { href: "/rendez-vous", label: "Rendez-vous", hint: "Réservez un appel, une visio ou une rencontre à Bordeaux." },
];

type Svc = { slug: string; title: string; tagline: string };
const RESSOURCES = [
  { href: "/blog", label: "Blog", text: "Conseils concrets pour votre site et votre référencement." },
  { href: "/faq", label: "Questions fréquentes", text: "Prix, délais, propriété du site, maintenance." },
  { href: "/rendez-vous", label: "Prendre rendez-vous", text: "Appel découverte, visio ou sur place." },
  { href: "/a-propos", label: "À propos", text: "Qui nous sommes et nos engagements." },
  { href: "/contact", label: "Contact et devis", text: "Une estimation sous 24 heures ouvrées." },
];

/** Le fond effectif sous un élément est-il sombre ? (remonte jusqu'à un fond opaque, calcule la luminance) */
function isDarkAt(el: Element | null) {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const m = getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!m) continue;
    const [r, g, b, a = "1"] = m[1].split(/[ ,/]+/).filter(Boolean);
    if (parseFloat(a) < 0.5) continue;
    return (0.2126 * +r + 0.7152 * +g + 0.0722 * +b) / 255 < 0.5;
  }
  return document.documentElement.dataset.theme === "dark";
}

/** Barre d'en-tête : transparente en haut, floutée au scroll, claire ou sombre selon la section dessous, masquée en descendant. */
export function Header({ services = [], hasCatalogue = false, email = "" }: { services?: Svc[]; hasCatalogue?: boolean; email?: string }) {
  const menu = hasCatalogue ? [...links.slice(0, 3), { href: "/catalogue", label: "Catalogue", hint: "Licences, logiciels et produits numériques." }, ...links.slice(3)] : links;
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [mega, setMega] = useState<null | "services" | "ressources">(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaRef = useRef<typeof mega>(null);
  megaRef.current = mega;
  const openMega = (k: "services" | "ressources" | null, delay = 0) => { if (timer.current) clearTimeout(timer.current); if (delay) timer.current = setTimeout(() => setMega(k), delay); else setMega(k); };
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
      if (!megaRef.current) setDark(tone ? tone === "dark" : isDarkAt(el));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    const t1 = setTimeout(tick, 500), t2 = setTimeout(tick, 1800); // après le préchargeur (première visite) qui recouvre l'en-tête
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [open, path]);
  useEffect(() => { setOpen(false); setHidden(false); setMega(null); }, [path]);
  useEffect(() => {
    if (!mega) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMega(null);
    const out = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest("[data-mega]")) setMega(null); };
    addEventListener("keydown", esc); addEventListener("pointerdown", out);
    return () => { removeEventListener("keydown", esc); removeEventListener("pointerdown", out); };
  }, [mega]);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), btn.current?.focus());
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const [themeDark, setThemeDark] = useState(false);
  useEffect(() => { const u = () => setThemeDark(document.documentElement.dataset.theme === "dark"); u(); const mo = new MutationObserver(u); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }); return () => mo.disconnect(); }, []);
  const light = open ? themeDark : dark; // texte et logo clairs
  const bg = scrolled && !open ? (dark ? "bg-ink-900/80 border-b" : "bg-ivory/85 border-b") : "border-b border-transparent";
  const line = dark ? "rgb(248 248 247 / .14)" : "rgb(28 28 28 / .1)";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`} data-header>
        <div className={`${bg} backdrop-blur-md transition-[background-color,border-color,backdrop-filter] duration-300`} style={{ borderColor: scrolled && !open ? line : "transparent", color: light ? "#F8F8F7" : "#1C1C1C", ["--acc-ctx" as string]: light ? "var(--accent-hi)" : "var(--accent)" }}>
          <div className={`container flex max-w-[1440px] items-center justify-between transition-[height] duration-300 ease-out ${scrolled ? "h-[54px]" : "h-[64px]"}`}>
            <Link href="/" aria-label="QS2H — accueil" className="relative z-[60] block shrink-0">
              <Image src={light ? "/logo-light.png" : "/logo.png"} alt="QS2H, solutions digitales" width={720} height={227} sizes="160px" priority className={`w-auto transition-[height] duration-300 ${scrolled ? "h-7" : "h-8"}`} />
            </Link>
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex" data-mega onMouseLeave={() => openMega(null, 160)}>
              {([{ k: "services", label: "Services", href: "/services" }, { href: "/realisations", label: "Réalisations" }, { href: "/tarifs", label: "Tarifs" }, ...(hasCatalogue ? [{ href: "/catalogue", label: "Catalogue" }] : []), { href: "/methode", label: "Méthode" }, { k: "ressources", label: "Ressources", href: "/blog" }] as { k?: "services" | "ressources"; href: string; label: string }[]).map((l) => {
                const active = path === l.href || path.startsWith(l.href + "/") || (l.k === "ressources" && ["/blog", "/faq", "/rendez-vous", "/a-propos", "/contact"].some((p) => path.startsWith(p)));
                if (l.k) {
                  const k = l.k;
                  return (
                    <div key={k} className="relative" onMouseEnter={() => openMega(k, 120)}>
                      <button type="button" aria-expanded={mega === k} aria-controls={`mega-${k}`} data-active={active} className="nav-link relative inline-flex items-center gap-1.5 px-4 py-2 text-[0.92rem] font-medium" onClick={() => openMega(mega === k ? null : k)}>
                        {l.label}
                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform duration-300 ${mega === k ? "rotate-180" : ""}`}><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  );
                }
                return (
                  <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className="nav-link relative px-4 py-2 text-[0.92rem] font-medium" data-active={active} onMouseEnter={() => openMega(null)}>
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="relative z-[60] flex items-center gap-3">
              <ThemeToggle />
              <Link href="/compte" className="btn btn-outline hidden !min-h-[44px] !px-5 !py-2.5 text-[0.88rem] xl:inline-flex">Espace client</Link>
              <Link href="/contact" className="btn btn-primary btn-fill !min-h-[44px] !px-5 !py-2.5 text-[0.9rem]"><span className="sm:hidden">Devis</span><span className="hidden sm:inline">Demander un devis</span></Link>
              <button ref={btn} type="button" className="btn btn-outline !min-h-[44px] !px-4 !py-2.5 text-[0.88rem] lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>{open ? "Fermer" : "Menu"}</button>
            </div>
          </div>
          {mega && (
            <div id={`mega-${mega}`} data-mega role="region" aria-label={mega === "services" ? "Nos services" : "Ressources"} className="hidden border-t lg:block" style={{ borderColor: line, background: dark ? "rgb(28 28 28 / .97)" : "rgb(248 248 247 / .98)", color: dark ? "#F8F8F7" : "#1C1C1C" }} onMouseEnter={() => openMega(mega)} onMouseLeave={() => openMega(null, 160)}>
              <div className="container max-w-[1440px] py-8">
                {mega === "services" ? (
                  <div className="grid gap-x-8 gap-y-2 md:grid-cols-3">
                    {services.map((sv, i) => (
                      <Link key={sv.slug} href={`/services/${sv.slug}`} className="mega-item group flex gap-4 rounded-2xl p-4">
                        <span className="mega-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                        <span><strong className="block font-serif text-[1.02rem]">{sv.title}</strong><span className="mega-sub block text-[0.88rem] leading-snug">{sv.tagline}</span></span>
                      </Link>
                    ))}
                    <Link href="/services" className="mega-item flex items-center gap-2 rounded-2xl p-4 font-semibold">Voir tous nos services <span aria-hidden="true">→</span></Link>
                  </div>
                ) : (
                  <div className="grid gap-x-8 gap-y-2 md:grid-cols-3">
                    {RESSOURCES.map((r) => (
                      <Link key={r.href} href={r.href} className="mega-item group block rounded-2xl p-4">
                        <strong className="block font-serif text-[1.02rem]">{r.label}</strong><span className="mega-sub block text-[0.88rem] leading-snug">{r.text}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" hidden={!open} data-tone="dark" className={`dark-section fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto px-6 pb-10 pt-28 transition-opacity duration-500 md:px-16 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="grid flex-1 gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <nav aria-label="Navigation du menu" className="flex flex-col">
            {menu.map((l, i) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onMouseLeave={() => setHover(null)} className="menu-row group flex items-baseline gap-5 border-b hair py-3 md:py-4">
                <span className="muted w-8 text-[0.8rem] tabular-nums tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                <span className="menu-mask"><span className="menu-text font-serif text-[clamp(1.5rem,3vw,2.3rem)] leading-[1.1]" style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms", transform: open ? "none" : "translateY(110%)" }}>{l.label}</span></span>
              </Link>
            ))}
          </nav>
          <aside className="hidden md:block" aria-hidden="true">
            <div className="relative flex min-h-[260px] flex-col justify-between rounded-[1.5rem] border hair p-8">
              <span className="font-serif text-[3.5rem] leading-none" style={{ color: "rgb(var(--accent-hi))" }}>{String((hover ?? 0) + 1).padStart(2, "0")}</span>
              <p key={hover ?? 0} className="swap max-w-[28ch] text-lg">{menu[hover ?? 0].hint}</p>
            </div>
          </aside>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary btn-fill"><span>Demander un devis gratuit</span></Link>
          <Link href="/rendez-vous" onClick={() => setOpen(false)} className="btn btn-outline">Prendre rendez-vous</Link>
          <Link href="/compte" onClick={() => setOpen(false)} className="btn btn-outline">Espace client</Link>
          <ThemeToggle />
          {email && <a href={`mailto:${email}`} className="muted text-sm underline md:ml-auto">{email}</a>}
        </div>
      </div>
    </>
  );
}

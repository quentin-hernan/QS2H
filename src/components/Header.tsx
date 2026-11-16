"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/services", label: "Services" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/methode", label: "Méthode" },
  { href: "/blog", label: "Blog" },
  { href: "/a-propos", label: "À propos" },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [small, setSmall] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setSmall(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), btn.current?.focus());
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={`border-b bg-ivory backdrop-blur-md transition-all duration-500 ease-out ${small ? "py-1.5 shadow-[0_8px_30px_-22px_rgba(0,0,0,.5)]" : "py-3"}`}
          style={{ borderColor: "rgb(21 21 21 / .12)" }}
        >
        <div className="container flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="QS2H — accueil" className="relative block shrink-0">
            <Image src="/logo.png" alt="QS2H, solutions digitales" width={720} height={227} sizes="(min-width: 768px) 160px, 130px" priority className={`w-auto transition-all duration-500 ${small ? "h-8 md:h-9" : "h-10 md:h-12"}`} />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = path === l.href || path.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={` px-4 py-2 text-[0.92rem] transition-colors hover:bg-ink-900/5 ${active ? "font-medium acc" : "text-ink-900/75"}`}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/compte" className="hidden px-3 py-2 text-[0.9rem] text-ink-900/75 hover:text-ink-900 xl:block">Espace client</Link>
            <Link href="/contact" className="btn btn-primary !min-h-[44px] !px-5 !py-3 text-[0.9rem]">
              Devis gratuit
            </Link>
            <button ref={btn} type="button" className="flex h-11 w-11 items-center justify-center border lg:hidden" style={{ borderColor: "rgb(21 21 21 / .2)" }} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((v) => !v)}>
              <span className="relative block h-3 w-5" aria-hidden="true">
                <span className={`absolute left-0 h-px w-5 bg-ink-900 transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-3 h-px w-5 bg-ink-900 transition-all duration-300 ${open ? "top-1.5 -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
        </div>
      </header>

      <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" hidden={!open} className={`dark-section fixed inset-0 z-40 flex flex-col justify-between px-6 pb-10 pt-28 transition-opacity duration-500 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <nav aria-label="Navigation mobile" className="flex flex-col">
          {links.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b hair py-4 font-serif text-5xl leading-none transition-transform duration-500" style={{ transitionDelay: `${i * 40}ms`, transform: open ? "none" : "translateY(20px)" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary w-full">
          Demander un devis gratuit
        </Link>
      </div>
    </>
  );
}

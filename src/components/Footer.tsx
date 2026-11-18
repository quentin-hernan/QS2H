import Link from "next/link";
import Image from "next/image";
import { getPage, getServices, getSettings } from "@/lib/content";
import { isPlaceholder } from "@/lib/utils";
import { ManageCookies } from "./CookieBanner";

/** Pied de page : grande phrase de clôture, navigation complète, coordonnées, informations légales. */
export async function Footer() {
  const [s, services, home] = await Promise.all([getSettings(), getServices(), getPage("home")]);
  const c = s.company;
  const year = new Date().getFullYear();
  const socials = [["LinkedIn", s.social.linkedin], ["Instagram", s.social.instagram], ["Facebook", s.social.facebook]].filter(([, u]) => u);
  const expertises = ((home.expertises ?? []) as { title: string; href?: string }[]).filter((e) => e.title);
  const col = "eyebrow mb-5 !text-[0.8rem]";
  return (
    <footer className="dark-section relative z-[2] overflow-hidden">
      <div className="container pt-20 md:pt-28">
        <div className="grid gap-12 py-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <Image src="/logo-light.png" alt="QS2H, solutions digitales" width={720} height={227} sizes="180px" className="logo-on-dark h-12 w-auto" />
            <Image src="/logo.png" alt="" aria-hidden="true" width={720} height={227} sizes="180px" className="logo-on-light h-12 w-auto" />
            <p className="muted mt-6 max-w-sm leading-relaxed">{s.footerText}</p>
          </div>
          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-10 md:col-span-8 md:grid-cols-4">
            {expertises.length > 0 && (
              <div><h2 className={col}>Expertises</h2><ul className="space-y-3 text-[0.97rem]">{expertises.map((e) => (<li key={e.title}><Link className="link-u" href={e.href || "/services"}>{e.title}</Link></li>))}</ul></div>
            )}
            <div><h2 className={col}>Services</h2><ul className="space-y-3 text-[0.97rem]">{services.map((x) => (<li key={x.slug}><Link className="link-u" href={`/services/${x.slug}`}>{x.title}</Link></li>))}</ul></div>
            <div><h2 className={col}>QS2H</h2><ul className="space-y-3 text-[0.97rem]">{[["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Méthode", "/methode"], ["À propos", "/a-propos"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Espace client", "/compte"]].map(([l, h]) => (<li key={h}><Link className="link-u" href={h}>{l}</Link></li>))}</ul></div>
            <div>
              <h2 className={col}>Contact</h2>
              <address className="space-y-3 text-[0.97rem] not-italic">
                <p><a className="link-u" href={`mailto:${c.email}`}>{c.email}</a></p>
                {!isPlaceholder(c.phone) && <p><a className="link-u" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></p>}
                <p className="muted">{c.hours}</p>
                <p className="muted">{c.city}</p>
              </address>
              {socials.length > 0 && <ul className="mt-5 flex flex-wrap gap-4 text-[0.9rem]">{socials.map(([n, u]) => (<li key={n}><a className="link-u" href={u} rel="noopener noreferrer" target="_blank">{n}</a></li>))}</ul>}
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t py-8 text-[0.85rem] muted md:flex-row md:items-center md:justify-between" style={{ borderColor: "rgb(248 248 247 / .14)" }}>
          <p>© {year} {c.name}. Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link className="link-u" href="/mentions-legales">Mentions légales</Link></li>
            <li><Link className="link-u" href="/politique-de-confidentialite">Confidentialité</Link></li>
            <li><Link className="link-u" href="/cgv">CGV</Link></li>
            <li><Link className="link-u" href="/cgu">CGU</Link></li>
            <li><Link className="link-u" href="/politique-de-cookies">Cookies</Link></li>
            <li><ManageCookies /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

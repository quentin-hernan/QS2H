import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/content";
import { isPlaceholder } from "@/lib/utils";
import { ManageCookies } from "./CookieBanner";

export async function Footer() {
  const s = await getSettings();
  const c = s.company;
  const year = new Date().getFullYear();
  const socials = [
    ["LinkedIn", s.social.linkedin],
    ["Instagram", s.social.instagram],
    ["Facebook", s.social.facebook],
  ].filter(([, u]) => u);
  return (
    <footer className="dark-section relative z-[2] overflow-hidden">
      <div className="container py-20 md:py-28">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Image src="/logo-light.png" alt="QS2H, solutions digitales" width={720} height={227} sizes="180px" className="h-14 w-auto" />
            <p className="muted mt-6 max-w-sm leading-relaxed">{s.footerText}</p>
            <Link href="/contact" className="btn btn-primary mt-8">
              Demander un devis
            </Link>
          </div>
          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
            <div>
              <h2 className="eyebrow mb-5">Services</h2>
              <ul className="space-y-3 text-[0.97rem]">
                {[["Site vitrine", "site-vitrine"], ["Sur mesure", "site-sur-mesure"], ["Refonte", "refonte-de-site"], ["E-commerce", "e-commerce"], ["Référencement SEO", "referencement-seo"], ["Maintenance", "maintenance-hebergement"]].map(([l, sl]) => (
                  <li key={sl}><Link className="link-u" href={`/services/${sl}`}>{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow mb-5">Agence</h2>
              <ul className="space-y-3 text-[0.97rem]">
                {[["Réalisations", "/realisations"], ["Tarifs", "/tarifs"], ["Méthode", "/methode"], ["À propos", "/a-propos"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"]].map(([l, h]) => (
                  <li key={h}><Link className="link-u" href={h}>{l}</Link></li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h2 className="eyebrow mb-5">Contact</h2>
              <address className="space-y-3 text-[0.97rem] not-italic">
                <p><a className="link-u" href={`mailto:${c.email}`}>{c.email}</a></p>
                {!isPlaceholder(c.phone) && <p><a className="link-u" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></p>}
                <p className="muted">{c.hours}</p>
                <p className="muted">{c.city}{!isPlaceholder(c.zip) ? `, ${c.zip}` : ""}</p>
              </address>
              {socials.length > 0 && (
                <ul className="mt-5 flex gap-4 text-[0.9rem]">
                  {socials.map(([n, u]) => (<li key={n}><a className="link-u" href={u} rel="noopener noreferrer" target="_blank">{n}</a></li>))}
                </ul>
              )}
            </div>
          </nav>
        </div>
        <div className="hair mt-16 flex flex-col gap-4 border-t pt-8 text-[0.85rem] muted md:flex-row md:items-center md:justify-between">
          <p>© {year} {c.name}. Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link className="link-u" href="/mentions-legales">Mentions légales</Link></li>
            <li><Link className="link-u" href="/politique-de-confidentialite">Confidentialité</Link></li>
            <li><Link className="link-u" href="/cgv">CGV</Link></li>
            <li><Link className="link-u" href="/cgu">CGU</Link></li>
            <li><Link className="link-u" href="/compte">Espace client</Link></li>
            <li><Link className="link-u" href="/politique-de-cookies">Cookies</Link></li>
            <li><ManageCookies /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: { href: string; label: string; owner?: boolean }[] }[] = [
  { title: "Activité", items: [{ href: "/admin", label: "Tableau de bord" }, { href: "/admin/demandes", label: "Demandes reçues" }, { href: "/admin/rendez-vous", label: "Rendez-vous" }, { href: "/admin/conversations", label: "Assistant (conversations)" }, { href: "/admin/clients", label: "Clients" }, { href: "/admin/commandes", label: "Commandes boutique" }] },
  { title: "Contenu", items: [{ href: "/admin/realisations", label: "Réalisations" }, { href: "/admin/services", label: "Services" }, { href: "/admin/boutique", label: "Boutique (articles)" }, { href: "/admin/produits", label: "Catalogue (produits)" }, { href: "/admin/tarifs", label: "Tarifs" }, { href: "/admin/options", label: "Options tarifaires" }, { href: "/admin/avis", label: "Avis clients" }, { href: "/admin/equipe", label: "Équipe" }, { href: "/admin/articles", label: "Blog" }, { href: "/admin/faq", label: "FAQ" }, { href: "/admin/pages", label: "Pages et textes" }, { href: "/admin/pages-libres", label: "Pages libres" }, { href: "/admin/apparence", label: "Apparence des pages" }, { href: "/admin/mediatheque", label: "Médiathèque" }] },
  { title: "Site", items: [{ href: "/admin/seo", label: "SEO et redirections" }, { href: "/admin/parametres", label: "Paramètres entreprise", owner: true }, { href: "/admin/legal", label: "Textes légaux", owner: true }] },
  { title: "Administration", items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", owner: true }, { href: "/admin/sauvegarde", label: "Sauvegardes et export", owner: true }, { href: "/admin/compte", label: "Mon compte" }] },
];

function NavList({ owner, newLeads }: { owner: boolean; newLeads: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Administration" className="space-y-6 text-[0.95rem]">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="eyebrow mb-2 !text-[0.7rem]">{g.title}</p>
          <ul>
            {g.items.filter((i) => !i.owner || owner).map((i) => {
              const active = i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(i.href + "/");
              return (
                <li key={i.href}>
                  <Link href={i.href} aria-current={active ? "page" : undefined} className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${active ? "bg-white/10 font-medium" : "muted hover:bg-white/5 hover:text-ivory"}`}>
                    {i.label}
                    {i.href === "/admin/demandes" && newLeads > 0 && <span className="acc-bg rounded-full px-2 py-0.5 text-xs font-semibold text-ink-900">{newLeads}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminNav({ owner, newLeads }: { owner: boolean; newLeads: number }) {
  return (
    <>
      <div className="hidden lg:block"><NavList owner={owner} newLeads={newLeads} /></div>
      <details className="mt-4 lg:hidden [&[open]>summary]:mb-4">
        <summary className="btn btn-ghost w-full">Menu</summary>
        <NavList owner={owner} newLeads={newLeads} />
      </details>
    </>
  );
}

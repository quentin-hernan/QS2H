"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/projets", label: "Mes projets" },
  { href: "/compte/demandes", label: "Demandes de modification" },
  { href: "/compte/messages", label: "Messagerie" },
  { href: "/compte/documents", label: "Documents" },
  { href: "/compte/factures", label: "Devis et factures" },
  { href: "/compte/rendez-vous", label: "Rendez-vous" },
  { href: "/compte/profil", label: "Mes informations" },
  { href: "/compte/donnees", label: "Données et droits" },
];

export function EspaceNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav aria-label="Espace client" className="es-nav">
      {NAV.map((n) => {
        const active = n.href === "/compte" ? path === "/compte" : path.startsWith(n.href);
        const b = badges[n.href] ?? 0;
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className="es-link">
            <span>{n.label}</span>
            {b > 0 && <span className="es-badge" aria-label={`${b} en attente`}>{b}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

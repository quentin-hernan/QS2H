import Link from "next/link";
import { requireClient } from "@/lib/client-auth";
import { logoutClient } from "../actions";

const nav = [
  { href: "/compte", label: "Suivi" },
  { href: "/compte/documents", label: "Documents" },
  { href: "/compte/messages", label: "Messagerie" },
  { href: "/compte/profil", label: "Mes informations" },
  { href: "/compte/donnees", label: "Mes données et mes droits" },
];

export default async function Espace({ children }: { children: React.ReactNode }) {
  const c = await requireClient();
  return (
    <section className="light-section pb-24 pt-32 md:pt-40">
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b hair pb-8">
          <div><p className="eyebrow solo mb-3">Espace client</p><h1 className="text-h2">Bonjour {c.firstName}</h1></div>
          <form action={logoutClient}><button className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Me déconnecter</button></form>
        </div>
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Espace client" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {nav.map((n) => (<Link key={n.href} href={n.href} className="border-l-2 border-transparent px-3 py-2 text-[0.95rem] hover:border-[rgb(var(--accent))]">{n.label}</Link>))}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

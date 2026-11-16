import Link from "next/link";
import { db } from "@/lib/db";
import { LEAD_STATUSES } from "@/lib/admin-resources";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Demandes reçues" };

export default async function Leads({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const leads = await db.lead.findMany({ where: statut ? { status: statut } : undefined, orderBy: { createdAt: "desc" } });
  const counts = await db.lead.groupBy({ by: ["status"], _count: true });
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm ${on ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`;
  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><h1 className="text-h2 font-medium">Demandes reçues</h1><a href="/api/admin/leads" className="btn btn-ghost">Exporter en CSV</a></header>
      <nav aria-label="Filtrer par statut" className="mb-8 flex flex-wrap gap-2">
        <Link href="/admin/demandes" className={chip(!statut)} style={{ borderColor: "rgb(242 239 233 / .25)" }}>Toutes</Link>
        {LEAD_STATUSES.map((s) => (<Link key={s} href={`/admin/demandes?statut=${encodeURIComponent(s)}`} className={chip(statut === s)} style={{ borderColor: "rgb(242 239 233 / .25)" }}>{s} ({n(s)})</Link>))}
      </nav>
      {leads.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={{ borderColor: "rgb(242 239 233 / .14)" }}>Aucune demande.</p> : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgb(242 239 233 / .14)" }}>
          <table className="w-full min-w-[720px] text-left text-[0.95rem]"><caption className="sr-only">Demandes</caption>
            <thead className="muted text-xs uppercase tracking-wider"><tr><th scope="col" className="p-4 font-medium">Contact</th><th scope="col" className="p-4 font-medium">Projet</th><th scope="col" className="p-4 font-medium">Budget</th><th scope="col" className="p-4 font-medium">Statut</th><th scope="col" className="p-4 font-medium">Reçue le</th></tr></thead>
            <tbody>{leads.map((l) => (
              <tr key={l.id} className="border-t" style={{ borderColor: "rgb(242 239 233 / .1)" }}>
                <td className="p-4"><Link href={`/admin/demandes/${l.id}`} className="font-medium underline-offset-4 hover:underline">{l.name}</Link><br /><span className="muted text-sm">{l.company || l.email}</span></td>
                <td className="p-4">{l.projectType}</td><td className="p-4">{l.budget}</td>
                <td className="p-4"><span className={l.status === "nouveau" ? "acc" : "muted"}>{l.status}</span></td>
                <td className="p-4 muted">{formatDate(l.createdAt)}</td>
              </tr>))}</tbody></table>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { fmtLong } from "@/lib/booking";

export const metadata = { title: "Mes rendez-vous" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await requireClient();
  const now = new Date();
  const [up, past] = await Promise.all([
    db.appointment.findMany({ where: { email: c.email, status: "confirmé", startsAt: { gte: now } }, orderBy: { startsAt: "asc" } }),
    db.appointment.findMany({ where: { email: c.email, OR: [{ startsAt: { lt: now } }, { status: "annulé" }] }, orderBy: { startsAt: "desc" }, take: 10 }),
  ]);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-h2 font-medium">Rendez-vous</h1><p className="muted mt-2">Les rendez-vous pris avec l&apos;adresse {c.email}.</p></div><Link href="/rendez-vous" className="btn btn-primary !min-h-[44px] !px-5 text-sm">Prendre rendez-vous</Link></header>
      <section aria-labelledby="up-h"><h2 id="up-h" className="mb-4 text-lg font-semibold">À venir</h2>
        {up.length === 0 ? <div className="es-card p-6"><p className="muted">Aucun rendez-vous prévu.</p></div> : (
          <ul className="grid gap-3">{up.map((a) => (<li key={a.id} className="es-card flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold first-letter:uppercase">{fmtLong(a.startsAt)}</p><p className="muted text-sm">{a.kind} · heure de Paris</p></div><Link href={`/rendez-vous/annuler/${a.token}`} className="muted text-sm underline">Annuler ou déplacer</Link></li>))}</ul>
        )}
      </section>
      {past.length > 0 && (
        <section aria-labelledby="past-h"><h2 id="past-h" className="mb-4 text-lg font-semibold">Historique</h2>
          <ul className="grid gap-2">{past.map((a) => (<li key={a.id} className="muted flex flex-wrap justify-between gap-3 border-b hair py-3 text-sm"><span className="first-letter:uppercase">{fmtLong(a.startsAt)} · {a.kind}</span><span>{a.status === "annulé" ? "Annulé" : "Passé"}</span></li>))}</ul>
        </section>
      )}
    </div>
  );
}

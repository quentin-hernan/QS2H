import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { fmtLong } from "@/lib/booking";

export const metadata = { title: "Mes rendez-vous" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await requireClient();
  const now = new Date();
  // rendez-vous rattachés au compte, ou pris avec l'adresse du compte une fois celle-ci confirmée
  const mine = { OR: [{ clientId: c.id }, ...(c.emailVerifiedAt ? [{ email: c.email }] : [])] };
  const [wait, up, past] = await Promise.all([
    db.appointment.findMany({ where: { AND: [mine, { status: "en attente", startsAt: { gte: now } }] }, orderBy: { startsAt: "asc" } }),
    db.appointment.findMany({ where: { AND: [mine, { status: "confirmé", startsAt: { gte: now } }] }, orderBy: { startsAt: "asc" } }),
    db.appointment.findMany({ where: { AND: [mine, { OR: [{ startsAt: { lt: now } }, { status: { in: ["annulé", "refusé"] } }] }] }, orderBy: { startsAt: "desc" }, take: 10 }),
  ]);
  const label = (s: string, startsAt: Date) => (s === "annulé" ? "Annulé" : s === "refusé" ? "Non retenu" : startsAt < now ? "Passé" : s);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-h2 font-medium">Rendez-vous</h1><p className="muted mt-2">Vos demandes de rendez-vous et leur validation par QS2H. Vos coordonnées sont reprises de votre compte : rien à retaper.</p></div><Link href="/rendez-vous" className="btn btn-primary !min-h-[44px] !px-5 text-sm">Prendre rendez-vous</Link></header>

      {wait.length > 0 && (
        <section aria-labelledby="wait-h"><h2 id="wait-h" className="mb-4 text-lg font-semibold">En attente de validation</h2>
          <ul className="grid gap-3">{wait.map((a) => (
            <li key={a.id} className="es-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div><p className="font-semibold first-letter:uppercase">{fmtLong(a.startsAt)}</p><p className="muted text-sm">{a.kind} · heure de Paris · créneau réservé, nous le confirmons rapidement</p></div>
              <span className="es-status" data-s="en cours">En attente</span>
              <Link href={`/rendez-vous/annuler/${a.token}`} className="muted w-full text-sm underline sm:w-auto">Annuler</Link>
            </li>))}</ul>
        </section>
      )}

      <section aria-labelledby="up-h"><h2 id="up-h" className="mb-4 text-lg font-semibold">Confirmés à venir</h2>
        {up.length === 0 ? <div className="es-card p-6"><p className="muted">Aucun rendez-vous confirmé pour l&apos;instant.</p></div> : (
          <ul className="grid gap-3">{up.map((a) => (
            <li key={a.id} className="es-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div><p className="font-semibold first-letter:uppercase">{fmtLong(a.startsAt)}</p><p className="muted text-sm">{a.kind} · heure de Paris</p></div>
              <span className="es-status" data-s="terminée">Confirmé</span>
              <Link href={`/rendez-vous/annuler/${a.token}`} className="muted text-sm underline">Annuler ou déplacer</Link>
            </li>))}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-h"><h2 id="past-h" className="mb-4 text-lg font-semibold">Historique</h2>
          <ul className="grid gap-2">{past.map((a) => (
            <li key={a.id} className="muted border-b hair py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-3"><span className="first-letter:uppercase">{fmtLong(a.startsAt)} · {a.kind}</span><span>{label(a.status, a.startsAt)}</span></div>
              {a.adminNote && <p className="mt-1">Message de QS2H : {a.adminNote}</p>}
            </li>))}</ul>
        </section>
      )}
    </div>
  );
}

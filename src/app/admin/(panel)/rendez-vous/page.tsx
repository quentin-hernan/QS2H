import { db } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { defaultSettings } from "@/lib/defaults";
import { fmtLong } from "@/lib/booking";
import { SettingsSection } from "@/components/admin/Misc";
import { RdvActions } from "@/components/admin/RdvActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rendez-vous" };

export default async function Rdv() {
  const s = await getSettings();
  const [pending, upcoming, past] = await Promise.all([
    db.appointment.findMany({ where: { status: "en attente", startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    db.appointment.findMany({ where: { status: "confirmé", startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    db.appointment.findMany({ where: { OR: [{ status: { in: ["annulé", "refusé"] } }, { startsAt: { lt: new Date() } }] }, orderBy: { startsAt: "desc" }, take: 30 }),
  ]);
  const ring = { borderColor: "rgb(242 239 233 / .14)" } as const;
  const row = (a: (typeof upcoming)[number]) => (
    <li key={a.id} className="rounded-2xl border p-4" style={ring}>
      <p className="font-medium">{fmtLong(a.startsAt)} <span className="muted font-normal">· {a.kind}{a.status !== "confirmé" ? ` · ${a.status}` : ""}</span></p>
      <p className="muted text-sm">{a.name} · <a className="underline" href={`mailto:${a.email}`}>{a.email}</a>{a.phone ? ` · ${a.phone}` : ""}</p>
      {a.message && <p className="mt-2 text-[0.95rem]">{a.message}</p>}
      {a.adminNote && <p className="muted mt-1 text-sm">Message envoyé : {a.adminNote}</p>}
      {a.status === "en attente" || (a.status === "confirmé" && a.startsAt > new Date()) ? <RdvActions id={a.id} status={a.status} /> : null}
    </li>
  );
  return (
    <div className="space-y-12">
      <h1 className="text-h2 font-medium">Rendez-vous</h1>
      <section aria-labelledby="wait"><h2 id="wait" className="mb-4 text-xl font-medium">À valider ({pending.length})</h2>{pending.length ? <ul className="space-y-3">{pending.map(row)}</ul> : <p className="muted">Aucune demande en attente.</p>}</section>
      <section aria-labelledby="up"><h2 id="up" className="mb-4 text-xl font-medium">À venir ({upcoming.length})</h2>{upcoming.length ? <ul className="space-y-3">{upcoming.map(row)}</ul> : <p className="muted">Aucun rendez-vous à venir.</p>}</section>
      <SettingsSection section="booking" title="Disponibilités" initial={{ ...defaultSettings.booking, ...(s.booking ?? {}) }} fields={[
        { name: "mon", label: "Lundi", hint: "Plages au format 09:00-12:00,14:00-18:00. Vide = fermé." },
        { name: "tue", label: "Mardi" }, { name: "wed", label: "Mercredi" }, { name: "thu", label: "Jeudi" }, { name: "fri", label: "Vendredi" }, { name: "sat", label: "Samedi" }, { name: "sun", label: "Dimanche" },
        { name: "buffer", label: "Pause entre deux rendez-vous (minutes)" },
        { name: "maxPerDay", label: "Rendez-vous maximum par jour" },
        { name: "noticeHours", label: "Délai minimum de réservation (heures)" },
        { name: "horizonDays", label: "Réservable jusqu'à (jours à l'avance)" },
        { name: "closed", label: "Jours de congé", type: "textarea", hint: "Dates AAAA-MM-JJ séparées par des virgules ou des espaces (ex. 2026-12-25, 2027-01-01)." },
      ]} />
      <section aria-labelledby="pa"><h2 id="pa" className="mb-4 text-xl font-medium">Passés et annulés</h2>{past.length ? <ul className="space-y-3">{past.map(row)}</ul> : <p className="muted">Aucun.</p>}</section>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { fmtLong } from "@/lib/booking";
import { formatDate, parseJson } from "@/lib/utils";

export const metadata = { title: "Mon espace client" };
export const dynamic = "force-dynamic";
type Step = { name: string; status: "a-venir" | "en-cours" | "termine"; note?: string };

export default async function Dashboard() {
  const c = await requireClient();
  const [projects, unread, mockups, nextRdv, docs, replies, requests] = await Promise.all([
    db.clientProject.findMany({ where: { clientId: c.id }, orderBy: { updatedAt: "desc" } }),
    db.clientMessage.count({ where: { clientId: c.id, fromClient: false, readAt: null } }),
    db.clientDocument.findMany({ where: { clientId: c.id, kind: "maquette", status: "" }, orderBy: { createdAt: "desc" } }),
    db.appointment.findFirst({ where: { email: c.email, status: "confirmé", startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    db.clientDocument.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.clientMessage.findMany({ where: { clientId: c.id, fromClient: false }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.clientRequest.findMany({ where: { clientId: c.id }, orderBy: { updatedAt: "desc" }, take: 3 }),
  ]);
  const main = projects[0];
  const steps = main ? parseJson<Step[]>(main.steps, []) : [];
  const done = steps.filter((s) => s.status === "termine").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const current = steps.find((s) => s.status === "en-cours") ?? steps.find((s) => s.status === "a-venir");
  const todo = [
    ...mockups.map((m) => ({ href: "/compte/documents?type=maquette", text: `Valider la maquette « ${m.title} »` })),
    ...(unread ? [{ href: "/compte/messages", text: `Lire ${unread} message${unread > 1 ? "s" : ""} de QS2H` }] : []),
  ];
  const activity = [
    ...docs.map((d) => ({ at: d.createdAt, text: `Document ajouté : ${d.title}`, href: "/compte/documents" })),
    ...replies.map((m) => ({ at: m.createdAt, text: `Message de QS2H : ${m.body.slice(0, 80)}${m.body.length > 80 ? "…" : ""}`, href: "/compte/messages" })),
    ...requests.map((r) => ({ at: r.updatedAt, text: `Demande « ${r.title} » : ${r.status}`, href: "/compte/demandes" })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 6);

  return (
    <div className="space-y-8">
      <header>
        <p className="muted text-sm">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(new Date())}</p>
        <h1 className="mt-1 text-h2 font-medium">Bonjour {c.firstName}.</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="es-card p-5">
          <p className="muted text-sm">Avancement {main ? `· ${main.title}` : ""}</p>
          {main ? (<><p className="mt-2 text-[2.2rem] font-semibold leading-none">{pct} %</p><div className="es-bar mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement du projet"><span style={{ width: `${pct}%` }} /></div></>) : <p className="mt-2">Aucun projet en cours.</p>}
        </div>
        <div className="es-card p-5"><p className="muted text-sm">Étape actuelle</p><p className="mt-2 text-lg font-semibold">{current?.name ?? (main ? "Projet terminé" : "—")}</p>{current?.note && <p className="muted mt-1 text-sm">{current.note}</p>}</div>
        <div className="es-card p-5"><p className="muted text-sm">Prochain rendez-vous</p>{nextRdv ? <><p className="mt-2 font-semibold first-letter:uppercase">{fmtLong(nextRdv.startsAt)}</p><p className="muted text-sm">{nextRdv.kind}</p></> : <p className="mt-2"><Link href="/rendez-vous" className="acc underline">Réserver un créneau</Link></p>}</div>
        <div className="es-card p-5"><p className="muted text-sm">Messages non lus</p><p className="mt-2 text-[2.2rem] font-semibold leading-none">{unread}</p><Link href="/compte/messages" className="acc mt-3 inline-block text-sm underline">Ouvrir la messagerie</Link></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="es-card p-6" aria-labelledby="todo-h">
          <h2 id="todo-h" className="text-lg font-semibold">À faire de votre côté</h2>
          {todo.length === 0 ? <p className="muted mt-3">Rien en attente. Nous vous prévenons par email dès qu&apos;une action est nécessaire.</p> : (
            <ul className="mt-4 space-y-2">{todo.map((t, i) => (<li key={i}><Link href={t.href} className="es-row">{t.text}<span aria-hidden="true">→</span></Link></li>))}</ul>
          )}
          <h2 className="mt-8 text-lg font-semibold">Actions rapides</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/compte/demandes#nouvelle" className="btn btn-primary !min-h-[44px] !px-5 text-sm">Demander une modification</Link>
            <Link href="/compte/messages" className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Écrire à QS2H</Link>
            <Link href="/rendez-vous" className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Prendre rendez-vous</Link>
            <Link href="/contact" className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Nouveau projet</Link>
          </div>
        </section>
        <section className="es-card p-6" aria-labelledby="act-h">
          <h2 id="act-h" className="text-lg font-semibold">Activité récente</h2>
          {activity.length === 0 ? <p className="muted mt-3">Aucune activité pour le moment.</p> : (
            <ol className="es-feed mt-4">{activity.map((a, i) => (<li key={i}><Link href={a.href} className="block hover:underline">{a.text}</Link><span className="muted text-xs">{formatDate(a.at)}</span></li>))}</ol>
          )}
        </section>
      </div>

      {main && (
        <section className="es-card p-6" aria-labelledby="steps-h">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="steps-h" className="text-lg font-semibold">Étapes de « {main.title} »</h2><Link href="/compte/projets" className="acc text-sm underline">Tous mes projets</Link></div>
          <ol className="es-steps mt-6">{steps.map((s, i) => (<li key={i} data-s={s.status}><span className="es-dot" aria-hidden="true" /><span className="font-medium">{s.name}</span><span className="muted text-xs">{s.status === "termine" ? "Terminé" : s.status === "en-cours" ? "En cours" : "À venir"}</span></li>))}</ol>
        </section>
      )}
    </div>
  );
}

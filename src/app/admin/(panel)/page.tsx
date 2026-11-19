import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { AnalyticsBoard } from "@/components/admin/AnalyticsBoard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard() {
  const [s, settings, leads, newCount, projects, drafts, posts, services] = await Promise.all([
    getSession(), getSettings(),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.lead.count({ where: { status: "nouveau" } }),
    db.project.count({ where: { status: "published" } }),
    db.project.count({ where: { status: "draft" } }),
    db.post.count({ where: { status: "published" } }),
    db.service.count({ where: { published: true } }),
  ]);
  const examples = await db.project.count({ where: { isExample: true } });
  const total30 = await db.lead.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } } });
  const plausible = settings.integrations.plausibleDomain;
  const card = "rounded-2xl border p-6";
  const ring = { borderColor: "rgb(242 239 233 / .14)" };
  return (
    <div className="space-y-10">
      <header><p className="eyebrow mb-4">Bonjour {s?.name}</p><h1 className="text-h2 font-medium">Tableau de bord</h1></header>

      <AnalyticsBoard />

      <section aria-label="Chiffres clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[[String(newCount), "demandes à traiter", "/admin/demandes"], [String(total30), "demandes sur 30 jours", "/admin/demandes"], [String(projects), `réalisations publiées${drafts ? ` (+${drafts} brouillon${drafts > 1 ? "s" : ""})` : ""}`, "/admin/realisations"], [String(posts), "articles publiés", "/admin/articles"]].map(([n, l, h]) => (
          <Link key={l} href={h} className={`${card} transition-colors hover:bg-white/5`} style={ring}><p className="font-serif text-5xl">{n}</p><p className="muted mt-2 text-sm">{l}</p></Link>
        ))}
      </section>

      {examples > 0 && (
        <p className="rounded-2xl border p-5 acc acc-border" role="note">
          {examples} réalisation{examples > 1 ? "s" : ""} d&apos;exemple (avec résultats fictifs) {examples > 1 ? "sont affichées" : "est affichée"} sur le site. Remplacez-les par vos vraies réalisations depuis <Link href="/admin/realisations" className="underline">Réalisations</Link>.
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <section className={card} style={ring} aria-labelledby="rec">
          <div className="mb-5 flex items-center justify-between"><h2 id="rec" className="text-xl font-medium">Demandes récentes</h2><Link href="/admin/demandes" className="muted text-sm underline">Tout voir</Link></div>
          {leads.length === 0 ? <p className="muted">Aucune demande pour l&apos;instant. Elles apparaîtront ici dès qu&apos;un visiteur remplit le formulaire.</p> : (
            <ul className="divide-y" style={{ borderColor: "rgb(242 239 233 / .1)" }}>{leads.map((l) => (
              <li key={l.id} className="border-t py-3 first:border-t-0" style={{ borderColor: "rgb(242 239 233 / .1)" }}><Link href={`/admin/demandes/${l.id}`} className="flex items-center justify-between gap-4"><span><span className="font-medium">{l.name}</span> <span className="muted text-sm">· {l.projectType}</span><br /><span className="muted text-sm">{l.company || l.email}</span></span><span className="text-right text-sm"><span className={l.status === "nouveau" ? "acc" : "muted"}>{l.status}</span><br /><span className="muted">{formatDate(l.createdAt)}</span></span></Link></li>))}</ul>
          )}
        </section>
        <section className={card} style={ring} aria-labelledby="raccourcis">
          <h2 id="raccourcis" className="mb-5 text-xl font-medium">Raccourcis</h2>
          <ul className="space-y-2">
            {[["/admin/realisations/new", "Ajouter une réalisation"], ["/admin/articles/new", "Écrire un article"], ["/admin/pages/home", "Modifier la page d'accueil"], ["/admin/mediatheque", "Importer des images"], ["/admin/tarifs", "Changer les tarifs"]].map(([h, l]) => (<li key={h}><Link href={h} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/5">{l}<span aria-hidden="true">→</span></Link></li>))}
          </ul>
          <div className="mt-6 border-t pt-5 text-sm" style={{ borderColor: "rgb(242 239 233 / .12)" }}>
            <p className="font-medium">Audience</p>
            {plausible ? <a className="acc underline" target="_blank" rel="noopener noreferrer" href={`https://plausible.io/${plausible}`}>Ouvrir les statistiques Plausible ↗</a> : <p className="muted">Mesure d&apos;audience non connectée. Renseignez votre domaine Plausible dans <Link href="/admin/parametres" className="underline">Paramètres</Link>.</p>}
            <p className="muted mt-3">{services} services publiés.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

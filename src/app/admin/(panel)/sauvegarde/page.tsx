import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Sauvegardes et export" };

export default async function Backup() {
  await requireSession("owner");
  const [leads, media, versions] = await Promise.all([db.lead.count(), db.media.count(), db.pageVersion.count()]);
  const ring = { borderColor: "rgb(242 239 233 / .14)" };
  return (
    <div className="max-w-3xl space-y-8">
      <header><h1 className="mb-3 text-h2 font-medium">Sauvegardes et export</h1></header>
      <section className="rounded-2xl border p-6 md:p-8" style={ring}>
        <h2 className="mb-2 text-xl font-medium">Export complet</h2>
        <p className="muted mb-5">Télécharge un fichier JSON contenant tous les contenus, demandes, réglages et références de médias ({leads} demandes, {media} médias, {versions} versions de pages). Les mots de passe et secrets 2FA ne sont jamais exportés.</p>
        <a href="/api/admin/export" className="btn btn-primary">Télécharger l&apos;export (JSON)</a>
      </section>
      <section className="rounded-2xl border p-6 md:p-8" style={ring}>
        <h2 className="mb-2 text-xl font-medium">Demandes de devis</h2>
        <p className="muted mb-5">Export CSV compatible Excel pour votre suivi commercial.</p>
        <a href="/api/admin/leads" className="btn btn-ghost">Exporter les demandes (CSV)</a>
      </section>
      <section className="muted rounded-2xl border p-6 text-sm leading-relaxed md:p-8" style={ring}>
        <h2 className="mb-2 text-xl font-medium text-ivory">Sauvegardes automatiques</h2>
        <p>Avec une base PostgreSQL hébergée (Neon, Supabase), les sauvegardes quotidiennes et la restauration à un instant donné sont assurées par l&apos;hébergeur. Activez-les dans le tableau de bord du service. Les images et documents sont stockés dans Supabase Storage (buckets <code>uploads</code> et <code>documents</code>) lorsque les variables <code>SUPABASE_URL</code> et <code>SUPABASE_SERVICE_ROLE_KEY</code> sont renseignées ; pensez à en faire une copie régulière.</p>
      </section>
    </div>
  );
}

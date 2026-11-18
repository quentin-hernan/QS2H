import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate, parseJson } from "@/lib/utils";

export const metadata = { title: "Mes projets" };
export const dynamic = "force-dynamic";
type Step = { name: string; status: "a-venir" | "en-cours" | "termine"; note?: string };
const KIND: Record<string, string> = { devis: "Devis", facture: "Facture", livrable: "Livrable", maquette: "Maquette", autre: "Document" };

export default async function Projets() {
  const c = await requireClient();
  const projects = await db.clientProject.findMany({ where: { clientId: c.id }, orderBy: { updatedAt: "desc" }, include: { documents: { orderBy: { createdAt: "desc" } } } });
  return (
    <div className="space-y-8">
      <header><h1 className="text-h2 font-medium">Mes projets</h1><p className="muted mt-2">Chaque étape est mise à jour par l&apos;équipe QS2H au fil du projet.</p></header>
      {projects.length === 0 ? (
        <div className="es-card p-8"><p>Aucun projet pour l&apos;instant.</p><p className="muted mt-2">Dès que nous démarrons ensemble, vous suivrez ici chaque étape, les maquettes et les livrables.</p><Link href="/contact" className="btn btn-primary mt-6 !min-h-[44px] !px-5 text-sm">Parler d&apos;un projet</Link></div>
      ) : projects.map((p) => {
        const steps = parseJson<Step[]>(p.steps, []);
        const done = steps.filter((s) => s.status === "termine").length;
        const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
        return (
          <article key={p.id} className="es-card p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h2 className="text-h3 font-medium">{p.title}</h2><p className="muted text-sm">Démarré le {formatDate(p.createdAt)} · mis à jour le {formatDate(p.updatedAt)}</p></div>
              <p className="text-2xl font-semibold">{pct} %</p>
            </div>
            <div className="es-bar mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Avancement de ${p.title}`}><span style={{ width: `${pct}%` }} /></div>
            <ol className="es-timeline mt-8">
              {steps.map((s, i) => (
                <li key={i} data-s={s.status}>
                  <span className="es-dot" aria-hidden="true" />
                  <p className="font-medium">{s.name} <span className="muted ml-2 text-xs">{s.status === "termine" ? "Terminé" : s.status === "en-cours" ? "En cours" : "À venir"}</span></p>
                  {s.note && <p className="muted text-sm">{s.note}</p>}
                </li>
              ))}
            </ol>
            {p.documents.length > 0 && (
              <div className="mt-8 border-t hair pt-6">
                <h3 className="mb-3 font-semibold">Documents du projet</h3>
                <ul className="space-y-2">{p.documents.map((d) => (<li key={d.id} className="flex flex-wrap items-center justify-between gap-3"><span>{d.title} <span className="muted text-sm">· {KIND[d.kind] ?? d.kind}{d.status ? ` · ${d.status}` : ""}</span></span><a className="acc text-sm underline" href={`/api/compte/documents/${d.id}`}>Télécharger</a></li>))}</ul>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3"><Link href={`/compte/demandes?projet=${p.id}#nouvelle`} className="btn btn-ghost !min-h-[44px] !px-5 text-sm">Demander une modification</Link></div>
          </article>
        );
      })}
    </div>
  );
}

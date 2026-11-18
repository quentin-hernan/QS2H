import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";
import { RequestForm } from "@/components/ClientForms";

export const metadata = { title: "Demandes de modification" };
export const dynamic = "force-dynamic";
const STATUS: Record<string, string> = { nouvelle: "Reçue", "en cours": "En cours", "terminée": "Terminée" };

export default async function Page({ searchParams }: { searchParams: Promise<{ projet?: string }> }) {
  const c = await requireClient();
  const { projet } = await searchParams;
  const [reqs, projects] = await Promise.all([
    db.clientRequest.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" } }),
    db.clientProject.findMany({ where: { clientId: c.id }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const ptitle = (id: string | null) => projects.find((p) => p.id === id)?.title;
  return (
    <div className="space-y-8">
      <header><h1 className="text-h2 font-medium">Demandes de modification</h1><p className="muted mt-2">Un texte à changer, une photo à remplacer, une page à ajouter : décrivez-le ici, suivez l&apos;avancement et la réponse de l&apos;équipe.</p></header>
      <section id="nouvelle" className="es-card p-6 md:p-8" aria-labelledby="new-h">
        <h2 id="new-h" className="mb-5 text-lg font-semibold">Nouvelle demande</h2>
        <RequestForm projects={projects} preset={projects.some((p) => p.id === projet) ? projet : undefined} />
      </section>
      <section aria-labelledby="list-h">
        <h2 id="list-h" className="mb-4 text-lg font-semibold">Mes demandes</h2>
        {reqs.length === 0 ? <div className="es-card p-6"><p className="muted">Aucune demande pour l&apos;instant.</p></div> : (
          <ul className="grid gap-3">
            {reqs.map((r) => (
              <li key={r.id} className="es-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-medium">{r.title}</p><p className="muted text-sm">{formatDate(r.createdAt)}{ptitle(r.projectId) ? ` · ${ptitle(r.projectId)}` : ""} · priorité {r.priority}</p></div>
                  <span className="es-status" data-s={r.status}>{STATUS[r.status] ?? r.status}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[0.95rem]">{r.details}</p>
                {r.reply && <div className="es-reply mt-4"><p className="muted mb-1 text-xs">Réponse de QS2H · {formatDate(r.updatedAt)}</p><p className="whitespace-pre-wrap">{r.reply}</p></div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

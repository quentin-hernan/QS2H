import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function Clients() {
  const rows = await db.client.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { projects: true, documents: true } }, messages: { where: { fromClient: true, readAt: null }, select: { id: true } } } });
  return (
    <div>
      <h1 className="mb-3 text-h2 font-medium">Clients</h1>
      <p className="muted mb-10 max-w-prose">Comptes créés depuis l&apos;espace client. Ouvrez une fiche pour suivre un projet, déposer un document ou répondre à un message.</p>
      {rows.length === 0 ? <p className="muted">Aucun compte client pour l&apos;instant.</p> : (
        <div className="overflow-x-auto border hair">
          <table className="w-full min-w-[640px] text-left text-[0.95rem]">
            <thead className="muted"><tr className="border-b hair"><th className="p-4 font-medium">Client</th><th className="font-medium">Entreprise</th><th className="font-medium">Statut</th><th className="font-medium">Projets / docs</th><th className="font-medium">Inscrit le</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b hair">
                  <td className="p-4"><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/clients/${c.id}`}>{c.firstName} {c.lastName}</Link><div className="muted text-[0.82rem]">{c.email}</div></td>
                  <td>{c.company || "—"}</td>
                  <td>{c.emailVerifiedAt ? "Vérifié" : "Email non vérifié"}{c.messages.length > 0 && <span className="acc ml-2 text-xs">{c.messages.length} message(s) non lu(s)</span>}</td>
                  <td>{c._count.projects} / {c._count.documents}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

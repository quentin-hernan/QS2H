import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";
import { MockupButtons } from "@/components/ClientForms";

export const metadata = { title: "Mes documents" };
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { devis: "Devis", facture: "Facture", livrable: "Livrable", maquette: "Maquette", autre: "Document" };

export default async function Page() {
  const c = await requireClient();
  const docs = await db.clientDocument.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h2 className="eyebrow mb-6">Documents</h2>
      {docs.length === 0 ? <p className="muted">Aucun document pour l&apos;instant.</p> : (
        <ul className="divide-y hair border-y hair">
          {docs.map((d) => (
            <li key={d.id} className="space-y-3 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium">{d.title}</p><p className="muted text-[0.85rem]">{KIND[d.kind] ?? d.kind} · {formatDate(d.createdAt)}</p></div>
                <a className="btn btn-ghost !min-h-[44px] !px-5 text-sm" href={`/api/compte/documents/${d.id}`}>Télécharger</a>
              </div>
              {d.kind === "maquette" && <MockupButtons id={d.id} status={d.status} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

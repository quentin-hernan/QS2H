import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";
import { MockupButtons } from "@/components/ClientForms";

const KIND: Record<string, string> = { devis: "Devis", facture: "Facture", livrable: "Livrable", maquette: "Maquette", autre: "Document" };
const TABS = [{ v: "", l: "Tous" }, { v: "maquette", l: "Maquettes" }, { v: "livrable", l: "Livrables" }, { v: "devis", l: "Devis" }, { v: "facture", l: "Factures" }, { v: "autre", l: "Autres" }];

/** Liste de documents (servis uniquement à leur propriétaire). `billing` : uniquement devis et factures. */
export async function DocumentsView({ type, billing = false }: { type?: string; billing?: boolean }) {
  const c = await requireClient();
  const kinds = billing ? ["devis", "facture"] : undefined;
  const where = { clientId: c.id, ...(type ? { kind: type } : kinds ? { kind: { in: kinds } } : {}) };
  const docs = await db.clientDocument.findMany({ where, orderBy: { createdAt: "desc" }, include: { project: { select: { title: true } } } });
  const base = billing ? "/compte/factures" : "/compte/documents";
  const tabs = billing ? [{ v: "", l: "Tous" }, { v: "devis", l: "Devis" }, { v: "facture", l: "Factures" }] : TABS;
  return (
    <div className="space-y-6">
      <header><h1 className="text-h2 font-medium">{billing ? "Devis et factures" : "Documents"}</h1><p className="muted mt-2">{billing ? "Vos devis et factures, téléchargeables à tout moment. Les factures sont conservées 10 ans (obligation légale)." : "Maquettes à valider, livrables et documents de vos projets. Les fichiers ne sont accessibles qu'à vous."}</p></header>
      <nav aria-label="Filtrer" className="flex flex-wrap gap-2">{tabs.map((t) => (<Link key={t.v} href={t.v ? `${base}?type=${t.v}` : base} aria-current={(type ?? "") === t.v ? "page" : undefined} className="es-chip">{t.l}</Link>))}</nav>
      {docs.length === 0 ? <div className="es-card p-8"><p className="muted">Aucun document dans cette catégorie.</p></div> : (
        <ul className="grid gap-3">
          {docs.map((d) => (
            <li key={d.id} className="es-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0"><p className="font-medium">{d.title}</p><p className="muted text-sm">{KIND[d.kind] ?? d.kind} · {formatDate(d.createdAt)}{d.project ? ` · ${d.project.title}` : ""}{d.status ? ` · ${d.status}` : ""}</p></div>
                <a className="btn btn-ghost !min-h-[44px] !px-5 text-sm" href={`/api/compte/documents/${d.id}`}>Télécharger</a>
              </div>
              {d.kind === "maquette" && <div className="mt-4"><MockupButtons id={d.id} status={d.status} /></div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


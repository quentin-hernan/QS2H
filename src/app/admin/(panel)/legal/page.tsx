import { notFound } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/content";
import { LEGAL_DOCS, latestLegal, legalHistory, sectionsToHtml, type DocKey } from "@/lib/legal-db";
import { requireSession } from "@/lib/auth";
import { LegalEditor } from "@/components/admin/LegalEditor";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Textes légaux" };

export default async function LegalAdmin({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  await requireSession("owner");
  const key = ((await searchParams).doc ?? "mentions") as DocKey;
  if (!(key in LEGAL_DOCS)) notFound();
  const [s, latest, hist] = await Promise.all([getSettings(), latestLegal(key), legalHistory(key)]);
  const html = latest?.html ?? sectionsToHtml(LEGAL_DOCS[key].template(s.company));
  return (
    <div>
      <h1 className="mb-3 text-h2 font-medium">Textes légaux</h1>
      <p className="muted mb-8 max-w-prose">Chaque enregistrement crée une nouvelle version datée ; l&apos;ancienne reste consultable sur le site. Pour un changement majeur, les clients sont prévenus par email.</p>
      <p className="mb-8 border hair p-4 text-[0.92rem]"><strong>À faire valider par un juriste avant mise en ligne.</strong> Les modèles sont pré-remplis depuis les paramètres entreprise.</p>
      <nav aria-label="Documents" className="mb-8 flex flex-wrap gap-2">
        {(Object.keys(LEGAL_DOCS) as DocKey[]).map((k) => (<Link key={k} href={`/admin/legal?doc=${k}`} aria-current={k === key ? "page" : undefined} className={`border px-4 py-2 text-sm hair ${k === key ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`}>{LEGAL_DOCS[k].title}</Link>))}
      </nav>
      <p className="muted mb-4 text-sm">{latest ? `Version en vigueur : ${latest.version} (${formatDate(latest.createdAt)})` : "Aucune version enregistrée : le site affiche le modèle généré (version 1)."}</p>
      <LegalEditor key={key} doc={key} initialHtml={html} />
      {hist.length > 0 && (<section className="mt-12"><h2 className="eyebrow mb-4">Historique</h2><ul className="space-y-1 text-sm">{hist.map((h) => (<li key={h.version}><a className="underline" href={`${LEGAL_DOCS[key].path}?version=${h.version}`} target="_blank" rel="noreferrer">Version {h.version}</a> · {formatDate(h.createdAt)}{h.major ? " · majeure" : ""}{h.note ? ` · ${h.note}` : ""}</li>))}</ul></section>)}
    </div>
  );
}

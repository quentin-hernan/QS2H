import Link from "next/link";
import { PageHero } from "./Blocks";
import { Breadcrumbs } from "./Breadcrumbs";
import { LEGAL_DOCS, latestLegal, legalHistory, sectionsToHtml, type DocKey } from "@/lib/legal-db";
import { getSettings } from "@/lib/content";
import { cleanHtml } from "@/lib/sanitize";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

/** Page légale : dernière version enregistrée dans le back-office, ou modèle généré depuis les paramètres entreprise. Les anciennes versions restent consultables (?version=n). */
export async function LegalDoc({ doc, version }: { doc: DocKey; version?: string }) {
  const meta = LEGAL_DOCS[doc];
  const [s, latest, history] = await Promise.all([getSettings(), latestLegal(doc), legalHistory(doc)]);
  const asked = version ? await db.legalVersion.findUnique({ where: { doc_version: { doc, version: Number(version) || 0 } } }) : null;
  const shown = asked ?? latest;
  const html = shown ? cleanHtml(shown.html) : sectionsToHtml(meta.template(s.company));
  const label = shown ? `Version ${shown.version} du ${formatDate(shown.createdAt)}` : "Version 1 · novembre 2026";
  const old = !!asked && asked.version !== latest?.version;
  return (
    <>
      <PageHero eyebrow="Informations légales" title={meta.title}>
        <Breadcrumbs items={[{ name: meta.title, path: meta.path }]} />
      </PageHero>
      <section className="light-section py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-12">
          <aside className="muted space-y-4 text-[0.9rem] lg:col-span-3">
            <p>{label}</p>
            {old && <p className="border hair p-3">Ancienne version. <Link className="acc underline" href={meta.path}>Voir la version en vigueur</Link></p>}
            {history.length > 1 && (
              <div><p className="label">Versions précédentes</p><ul className="space-y-1">{history.filter((h) => h.version !== shown?.version).map((h) => (<li key={h.version}><Link className="link-u" href={`${meta.path}?version=${h.version}`}>Version {h.version} · {formatDate(h.createdAt)}</Link></li>))}</ul></div>
            )}
          </aside>
          <div className="prose-qs legal lg:col-span-8" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resourceByKey } from "@/lib/admin-resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { parseJson } from "@/lib/utils";

const NEW_TITLE: Record<string, string> = { realisations: "Nouvelle réalisation", services: "Nouveau service", tarifs: "Nouvelle formule", options: "Nouvelle option", faq: "Nouvelle question", avis: "Nouvel avis", articles: "Nouvel article", equipe: "Nouveau membre", redirections: "Nouvelle redirection" };

export default async function EditResource({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: key, id } = await params;
  const r = resourceByKey(key);
  if (!r) notFound();
  let initial: Record<string, unknown> = {};
  if (id === "new") {
    for (const f of r.fields) {
      if (f.name === "status") initial.status = "draft";
      if (f.name === "published" || f.name === "visible") initial[f.name] = true;
      if (f.name === "rating") initial.rating = 5;
      if (f.name === "priceUnit") initial.priceUnit = "€ HT";
      if (f.name === "priceNote") initial.priceNote = "HT";
      if (f.name === "cta") initial.cta = "Demander ce devis";
      if (f.name === "permanent") initial.permanent = true;
      if (f.name === "category") initial.category = "Conseils";
      if (f.name === "author") initial.author = "QS2H";
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (db as any)[r.model].findUnique({ where: { id } });
    if (!row) notFound();
    initial = { ...row };
    for (const j of r.json) initial[j] = parseJson(row[j], []);
    if (row.publishedAt) initial.publishedAt = new Date(row.publishedAt).toISOString();
  }
  const services = await db.service.findMany({ orderBy: { order: "asc" }, select: { slug: true, title: true } });
  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="muted mb-6 text-sm"><Link href={`/admin/${r.key}`} className="underline">{r.label}</Link> / {id === "new" ? "Nouveau" : "Modifier"}</nav>
      <h1 className="mb-10 text-h2 font-medium">{id === "new" ? NEW_TITLE[r.key] ?? `Nouveau : ${r.singular}` : `Modifier : ${String(initial[r.titleField] ?? "")}`}</h1>
      <ResourceForm resource={r} id={id} initial={initial} serviceOptions={services.map((s) => ({ value: s.slug, label: s.title }))} />
    </div>
  );
}

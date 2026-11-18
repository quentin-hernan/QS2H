import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { cleanSections } from "@/lib/sections";
import { parseJson } from "@/lib/utils";

export const metadata = { title: "Modifier une page libre" };

export default async function EditCustomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.customPage.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="muted mb-6 text-sm"><Link href="/admin/pages-libres" className="underline">Pages libres</Link> / {p.title}</nav>
      <h1 className="mb-8 text-h2 font-medium">{p.title}</h1>
      <PageBuilder id={p.id} initial={{ title: p.title, slug: p.slug, description: p.description, published: p.published, sections: cleanSections(parseJson<unknown[]>(p.sections, [])) }} />
    </div>
  );
}

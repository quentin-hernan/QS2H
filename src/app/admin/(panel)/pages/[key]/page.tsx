import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pageSchemas } from "@/lib/defaults";
import { getPage } from "@/lib/content";
import { PageEditor } from "@/components/admin/Misc";

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const schema = pageSchemas.find((p) => p.key === key);
  if (!schema) notFound();
  const [initial, versions] = await Promise.all([getPage(key), db.pageVersion.findMany({ where: { key }, orderBy: { createdAt: "desc" }, take: 15 })]);
  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="muted mb-6 text-sm"><Link href="/admin/pages" className="underline">Pages et textes</Link> / {schema.label}</nav>
      <h1 className="mb-10 text-h2 font-medium">{schema.label}</h1>
      <PageEditor schema={schema} initial={initial} versions={versions.map((v) => ({ id: v.id, author: v.author, createdAt: v.createdAt.toISOString() }))} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resourceByKey } from "@/lib/admin-resources";
import { RowActions } from "@/components/admin/Misc";
import { formatDate } from "@/lib/utils";

export default async function ResourceList({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: key } = await params;
  const r = resourceByKey(key);
  if (!r) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await (db as any)[r.model].findMany({ orderBy: r.orderable ? { order: "asc" } : r.model === "post" ? { createdAt: "desc" } : { id: "asc" } });
  const cell = (row: Record<string, unknown>, name: string) => {
    const v = row[name];
    if (typeof v === "boolean") return v ? <span className="acc">✓</span> : <span className="muted">—</span>;
    if (v instanceof Date) return formatDate(v);
    if (name === "status") return <span className={`rounded-full border px-2.5 py-0.5 text-xs ${v === "published" ? "acc acc-border" : "muted"}`} style={v === "published" ? undefined : { borderColor: "rgb(242 239 233 / .25)" }}>{v === "published" ? "Publié" : "Brouillon"}</span>;
    return String(v ?? "—");
  };
  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-h2 font-medium">{r.label}</h1>{r.help && <p className="muted mt-3 max-w-2xl text-sm">{r.help}</p>}</div>
        <Link href={`/admin/${r.key}/new`} className="btn btn-primary">+ Ajouter</Link>
      </header>
      {rows.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={{ borderColor: "rgb(242 239 233 / .14)" }}>Rien ici pour l&apos;instant.</p> : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgb(242 239 233 / .14)" }}>
          <table className="w-full min-w-[640px] text-left text-[0.95rem]">
            <caption className="sr-only">{r.label}</caption>
            <thead className="muted text-xs uppercase tracking-wider"><tr>{r.columns.map((c) => (<th key={c.name} scope="col" className="p-4 font-medium">{c.label}</th>))}<th scope="col" className="p-4 text-right font-medium">Actions</th></tr></thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-t" style={{ borderColor: "rgb(242 239 233 / .1)" }}>
                  {r.columns.map((c, ci) => (
                    <td key={c.name} className="p-4">{ci === 0 ? (<Link href={`/admin/${r.key}/${row.id}`} className="font-medium underline-offset-4 hover:underline">{cell(row, c.name)}{row.isExample && <span className="acc ml-2 text-xs">exemple</span>}</Link>) : cell(row, c.name)}</td>
                  ))}
                  <td className="p-4"><RowActions resourceKey={r.key} id={row.id} orderable={r.orderable} duplicable={!!r.duplicable} first={i === 0} last={i === rows.length - 1} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

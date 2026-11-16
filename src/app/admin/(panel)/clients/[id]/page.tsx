import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ClientAdmin } from "@/components/admin/ClientAdmin";
import { formatDate, parseJson } from "@/lib/utils";

export const metadata = { title: "Fiche client" };
export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, session] = await Promise.all([
    db.client.findUnique({ where: { id }, include: { projects: { orderBy: { createdAt: "desc" } }, documents: { orderBy: { createdAt: "desc" } }, messages: { orderBy: { createdAt: "asc" } }, consents: { orderBy: { givenAt: "desc" } } } }),
    getSession(),
  ]);
  if (!c) notFound();
  await db.clientMessage.updateMany({ where: { clientId: id, fromClient: true, readAt: null }, data: { readAt: new Date() } });
  return (
    <div className="space-y-12">
      <nav aria-label="Fil d'Ariane" className="muted text-sm"><Link href="/admin/clients" className="underline">Clients</Link> / {c.firstName} {c.lastName}</nav>
      <header>
        <h1 className="text-h2 font-medium">{c.firstName} {c.lastName}</h1>
        <p className="muted mt-2">{c.email}{c.company ? ` · ${c.company}` : ""} · inscrit le {formatDate(c.createdAt)} · {c.emailVerifiedAt ? "email vérifié" : "email non vérifié"} · actualités : {c.newsletter ? "oui" : "non"}</p>
      </header>
      <ClientAdmin
        clientId={c.id}
        isOwner={session?.role === "owner"}
        projects={c.projects.map((p) => ({ id: p.id, title: p.title, steps: parseJson(p.steps, []) }))}
        documents={c.documents.map((d) => ({ id: d.id, title: d.title, kind: d.kind, status: d.status, projectId: d.projectId, createdAt: d.createdAt.toISOString() }))}
        messages={c.messages.map((m) => ({ id: m.id, body: m.body, fromClient: m.fromClient, createdAt: m.createdAt.toISOString() }))}
      />
      <section>
        <h2 className="eyebrow mb-4">Consentements</h2>
        <ul className="muted space-y-1 text-sm">{c.consents.map((k) => (<li key={k.id}>{k.kind} · v{k.docVersion} · {formatDate(k.givenAt)} · IP {k.ipTruncated || "—"}{k.withdrawnAt ? ` · retiré le ${formatDate(k.withdrawnAt)}` : ""}</li>))}</ul>
      </section>
    </div>
  );
}

import "server-only";
import { db } from "./db";
import { removePrivate } from "./storage";

/** Supprime ou anonymise toutes les données du client. Les factures sont dissociées du compte et conservées 10 ans (obligation légale). */
export async function eraseClient(id: string) {
  const c = await db.client.findUnique({ where: { id } });
  if (!c) return;
  const docs = await db.clientDocument.findMany({ where: { clientId: id } });
  const retain = new Date(Date.now() + 10 * 365 * 864e5);
  for (const d of docs) {
    if (d.kind === "facture") await db.clientDocument.update({ where: { id: d.id }, data: { clientId: null, projectId: null, retainedUntil: retain, title: `${d.title} (client supprimé)` } });
    else { await db.clientDocument.delete({ where: { id: d.id } }); await removePrivate(d.file); }
  }
  await db.lead.deleteMany({ where: { OR: [{ clientId: id }, { email: c.email }] } });
  await db.client.delete({ where: { id } });
}


/** Export complet des données d'un client (droit d'accès et de portabilité). */
export async function exportClient(id: string) {
  const c = await db.client.findUnique({
    where: { id },
    include: { consents: true, logins: { orderBy: { createdAt: "desc" }, take: 200 }, projects: true, documents: true, messages: true },
  });
  if (!c) return null;
  const leads = await db.lead.findMany({ where: { OR: [{ clientId: id }, { email: c.email }] } });
  const { passwordHash: _p, verifyTokenHash: _v, resetTokenHash: _r, deleteTokenHash: _d, newsletterTokenHash: _n, unsubToken: _u, ...profile } = c;
  void _p; void _v; void _r; void _d; void _n; void _u;
  const { consents, logins, projects, documents, messages, ...rest } = profile;
  return { exportedAt: new Date().toISOString(), profile: rest, consents, logins, projects, documents: documents.map(({ file: _f, ...d }) => { void _f; return d; }), messages, quoteRequests: leads };
}

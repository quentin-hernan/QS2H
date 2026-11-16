/**
 * Comptes clients inactifs : avertissement par email à 35 mois, suppression à 36 mois (3 ans) sans connexion.
 * À planifier une fois par jour (cron, GitHub Actions, tâche planifiée Vercel) : npx tsx --env-file=.env scripts/purge-inactive.ts
 */
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import fs from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const MONTH = 30 * 864e5;
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

async function mail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return console.log(`[mail:dev] → ${to} | ${subject}`);
  await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.MAIL_FROM || "QS2H <noreply@qs2h.fr>", to, subject, html });
}

async function main() {
  const now = Date.now();
  const last = (c: { lastLoginAt: Date | null; createdAt: Date }) => (c.lastLoginAt ?? c.createdAt).getTime();
  const clients = await db.client.findMany();
  let warned = 0, erased = 0;
  for (const c of clients) {
    const idle = now - last(c);
    if (idle >= 36 * MONTH) {
      const docs = await db.clientDocument.findMany({ where: { clientId: c.id } });
      for (const d of docs) {
        if (d.kind === "facture") await db.clientDocument.update({ where: { id: d.id }, data: { clientId: null, projectId: null, retainedUntil: new Date(now + 10 * 365 * 864e5), title: `${d.title} (client supprimé)` } });
        else { await db.clientDocument.delete({ where: { id: d.id } }); await fs.rm(path.join(process.cwd(), "storage", "documents", d.file), { force: true }); }
      }
      await db.lead.deleteMany({ where: { OR: [{ clientId: c.id }, { email: c.email }] } });
      await db.client.delete({ where: { id: c.id } });
      erased++;
    } else if (idle >= 35 * MONTH && !c.inactivityWarnedAt) {
      await mail(c.email, "Votre compte QS2H sera supprimé dans un mois", `<p>Bonjour ${c.firstName}, votre compte n'a pas été utilisé depuis près de trois ans. Il sera supprimé dans un mois sauf connexion : <a href="${SITE}/compte/connexion">${SITE}/compte/connexion</a>.</p>`);
      await db.client.update({ where: { id: c.id }, data: { inactivityWarnedAt: new Date() } });
      warned++;
    }
  }
  console.log(`Comptes avertis : ${warned} · supprimés : ${erased}`);
}
main().finally(() => db.$disconnect());

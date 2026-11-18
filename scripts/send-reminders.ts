/**
 * Rappel des rendez-vous 24 h avant. À planifier toutes les heures :
 *   npx tsx --env-file=.env scripts/send-reminders.ts
 */
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const db = new PrismaClient();
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const when = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d);

async function main() {
  const now = Date.now();
  const due = await db.appointment.findMany({ where: { status: "confirmé", reminded: false, startsAt: { gt: new Date(now), lte: new Date(now + 24 * 3600e3) } } });
  const key = process.env.RESEND_API_KEY;
  for (const a of due) {
    const html = `<p>Bonjour ${a.name},</p><p>Rappel : ${a.kind} le <strong>${when(a.startsAt)}</strong> (heure de Paris).</p><p>Un empêchement ? <a href="${SITE}/rendez-vous/annuler/${a.token}">Annuler le rendez-vous</a>.</p><p>L'équipe QS2H</p>`;
    if (key) await new Resend(key).emails.send({ from: process.env.MAIL_FROM || "QS2H <noreply@qs2h.fr>", to: a.email, subject: `Rappel : rendez-vous ${when(a.startsAt)}`, html });
    else console.log(`[mail:dev] rappel → ${a.email}`);
    await db.appointment.update({ where: { id: a.id }, data: { reminded: true } });
  }
  console.log(`Rappels envoyés : ${due.length}`);
}
main().finally(() => db.$disconnect());

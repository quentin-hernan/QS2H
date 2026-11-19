"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { fmtLong } from "@/lib/booking";

/** Annulation par lien sécurisé (jeton à usage libre, valable tant que le rendez-vous n'est pas passé). */
export async function cancelAppointment(token: string) {
  const a = await db.appointment.findUnique({ where: { token } });
  if (a && (a.status === "confirmé" || a.status === "en attente") && a.startsAt.getTime() > Date.now()) {
    await db.appointment.update({ where: { id: a.id }, data: { status: "annulé" } });
    const s = await getSettings();
    await sendMail({ to: process.env.MAIL_TO || s.company.email, subject: `Rendez-vous annulé — ${a.name}`, html: layout("Rendez-vous annulé", `<p>${esc(a.name)} (${esc(a.email)}) a annulé : ${esc(a.kind)}, ${esc(fmtLong(a.startsAt))}.</p>`) });
  }
  redirect(`/rendez-vous/annuler/${token}?ok=1`);
}

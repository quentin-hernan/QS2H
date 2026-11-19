"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { fmtLong, ics, kindById, KINDS } from "@/lib/booking";
import { notifyClient } from "@/lib/notify";

type Result = { ok: boolean; error?: string; message?: string };
const refresh = () => { revalidatePath("/admin/rendez-vous"); revalidatePath("/compte/rendez-vous"); revalidatePath("/admin"); };
const kindOf = (label: string) => KINDS.find((k) => k.label === label) ?? kindById("visio");

/** Valide un rendez-vous demandé : le client reçoit la confirmation avec le fichier agenda. */
export async function confirmAppointment(id: string): Promise<Result> {
  const s = await requireSession();
  const a = await db.appointment.findUnique({ where: { id } });
  if (!a) return { ok: false, error: "Rendez-vous introuvable." };
  if (a.startsAt.getTime() < Date.now()) return { ok: false, error: "Ce créneau est déjà passé." };
  await db.appointment.update({ where: { id }, data: { status: "confirmé", adminNote: "" } });
  await audit(s.email, "rendez-vous confirmé", "appointment", id);
  const st = await getSettings();
  const kind = kindOf(a.kind);
  const when = fmtLong(a.startsAt);
  const cancel = `${SITE_URL}/rendez-vous/annuler/${a.token}`;
  const where = kind?.id === "sur-place" ? `${st.company.address}, ${st.company.zip} ${st.company.city}` : kind?.id === "visio" ? "Visioconférence (lien envoyé avant le rendez-vous)" : "Par téléphone";
  await notifyClient(a.clientId, { kind: "rdv", title: "Rendez-vous confirmé", body: `${a.kind} · ${when}`, link: "/compte/rendez-vous" });
  const file = ics({ id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, title: `${a.kind} QS2H`, description: `Rendez-vous avec QS2H. Annuler ou déplacer : ${cancel}`, location: where });
  const ok = await sendMail({
    to: a.email, subject: `Rendez-vous confirmé : ${when}`, attachments: [{ filename: "rendez-vous-qs2h.ics", content: file }],
    html: layout("Votre rendez-vous est confirmé", `<p style="line-height:1.6">Bonjour ${esc(a.name)},</p><p style="line-height:1.6">Bonne nouvelle : nous avons validé votre rendez-vous.</p><p style="line-height:1.6"><strong>${esc(a.kind)}</strong><br>${esc(when)} (heure de Paris)<br>${esc(where)}</p><p style="font-size:13px;color:#5A5F66">Un fichier agenda est joint. Un empêchement ? Annulez ici : ${cancel}</p>`),
  });
  refresh();
  return { ok: true, message: ok ? "Rendez-vous confirmé, le client a reçu l'email avec le fichier agenda." : "Rendez-vous confirmé (l'email n'a pas pu partir : vérifiez la configuration des emails)." };
}

/** Refuse ou annule un rendez-vous, avec un message au client (motif, proposition d'un autre créneau). */
export async function declineAppointment(id: string, reason: string): Promise<Result> {
  const s = await requireSession();
  const a = await db.appointment.findUnique({ where: { id } });
  if (!a) return { ok: false, error: "Rendez-vous introuvable." };
  const wasConfirmed = a.status === "confirmé";
  const note = String(reason ?? "").trim().slice(0, 1000);
  await db.appointment.update({ where: { id }, data: { status: wasConfirmed ? "annulé" : "refusé", adminNote: note } });
  await audit(s.email, wasConfirmed ? "rendez-vous annulé par QS2H" : "rendez-vous refusé", "appointment", id);
  await notifyClient(a.clientId, { kind: "rdv", title: wasConfirmed ? "Rendez-vous annulé" : "Créneau non disponible", body: note || "Choisissez un autre créneau quand vous le souhaitez.", link: "/compte/rendez-vous" });
  const ok = await sendMail({
    to: a.email, subject: `Rendez-vous ${wasConfirmed ? "annulé" : "non disponible"} : ${fmtLong(a.startsAt)}`,
    html: layout(wasConfirmed ? "Votre rendez-vous est annulé" : "Ce créneau n'est pas disponible", `<p style="line-height:1.6">Bonjour ${esc(a.name)},</p><p style="line-height:1.6">Nous ne pouvons malheureusement pas maintenir le rendez-vous du <strong>${esc(fmtLong(a.startsAt))}</strong>.</p>${note ? `<p style="line-height:1.6;white-space:pre-wrap">${esc(note)}</p>` : ""}<p><a href="${SITE_URL}/rendez-vous" style="display:inline-block;background:#2A5587;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none">Choisir un autre créneau</a></p>`),
  });
  refresh();
  return { ok: true, message: ok ? "Le client a été prévenu par email." : "Enregistré (l'email n'a pas pu partir : vérifiez la configuration des emails)." };
}

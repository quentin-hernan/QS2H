import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { availableDates, fmtLong, freeSlots, ics, kindById, newToken, parisToDate } from "@/lib/booking";

export const runtime = "nodejs";

/** GET ?kind=visio → jours disponibles ; GET ?kind=visio&date=2026-12-03 → créneaux libres de ce jour. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const kind = kindById(u.searchParams.get("kind") || "");
  if (!kind) return NextResponse.json({ ok: false, error: "Type de rendez-vous inconnu." }, { status: 400 });
  const date = u.searchParams.get("date");
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ ok: false, error: "Date invalide." }, { status: 400 });
    const slots = (await freeSlots([date], kind.minutes))[date] ?? [];
    return NextResponse.json({ ok: true, slots }, { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: true, dates: await availableDates(kind.minutes) }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  kind: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide.").max(200),
  phone: z.string().trim().max(30).regex(/^[0-9+().\s-]*$/, "Numéro invalide.").optional().or(z.literal("")),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter le traitement de vos données." }) }),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  if (!rateLimit(`rdv:${ip}`, 5, 60 * 60 * 1000).ok) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Certains champs sont invalides." }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });
  const kind = kindById(d.kind);
  if (!kind) return NextResponse.json({ ok: false, error: "Type de rendez-vous inconnu." }, { status: 400 });

  // le créneau doit toujours être libre (un autre visiteur a pu le prendre entre-temps)
  const free = (await freeSlots([d.date], kind.minutes))[d.date] ?? [];
  if (!free.includes(d.time)) return NextResponse.json({ ok: false, error: "Ce créneau vient d'être pris. Choisissez-en un autre." }, { status: 409 });

  const startsAt = parisToDate(d.date, d.time), endsAt = new Date(startsAt.getTime() + kind.minutes * 60e3);
  const token = newToken();
  const appt = await db.appointment.create({ data: { startsAt, endsAt, kind: kind.label, name: d.name, email: d.email, phone: d.phone || "", message: d.message || "", token } });
  // un contact dans l'admin (CRM)
  await db.lead.create({ data: { name: d.name, email: d.email, phone: d.phone || "", projectType: `Rendez-vous : ${kind.label}`, message: d.message || "", consent: true, source: "rendez-vous" } });

  const s = await getSettings();
  const when = fmtLong(startsAt);
  const cancel = `${SITE_URL}/rendez-vous/annuler/${token}`;
  const where = kind.id === "sur-place" ? `${s.company.address}, ${s.company.zip} ${s.company.city}` : kind.id === "visio" ? "Visioconférence (lien envoyé avant le rendez-vous)" : "Par téléphone";
  const file = ics({ id: appt.id, startsAt, endsAt, title: `${kind.label} QS2H`, description: `Rendez-vous avec QS2H. Annuler ou déplacer : ${cancel}`, location: where });
  await Promise.all([
    sendMail({
      to: d.email, subject: `Rendez-vous confirmé : ${when}`, attachments: [{ filename: "rendez-vous-qs2h.ics", content: file }],
      html: layout("Votre rendez-vous est confirmé", `<p style="line-height:1.6">Bonjour ${esc(d.name)},</p><p style="line-height:1.6"><strong>${esc(kind.label)}</strong><br>${esc(when)} (heure de Paris), durée ${kind.minutes} min.<br>${esc(where)}</p><p style="line-height:1.6">Le fichier joint l'ajoute à votre agenda. Vous recevrez un rappel 24 heures avant.</p><p style="line-height:1.6">Un empêchement ? <a href="${cancel}">Annuler ou déplacer le rendez-vous</a>.</p>`),
    }),
    sendMail({ to: process.env.MAIL_TO || s.company.email, subject: `Nouveau rendez-vous — ${d.name}, ${when}`, replyTo: d.email, html: layout("Nouveau rendez-vous", `<p><strong>${esc(d.name)}</strong> · ${esc(d.email)}${d.phone ? " · " + esc(d.phone) : ""}</p><p>${esc(kind.label)} — ${esc(when)}</p><p style="white-space:pre-wrap">${esc(d.message || "")}</p>`) }),
  ]);
  return NextResponse.json({ ok: true, when, kind: kind.label });
}

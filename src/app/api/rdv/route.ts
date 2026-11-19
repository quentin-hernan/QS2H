import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { withAccount } from "@/lib/lead-account";
import { SITE_URL } from "@/lib/utils";
import { availableDates, fmtLong, freeSlots, kindById, newToken, parisToDate } from "@/lib/booking";

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

  const acc = await withAccount({ name: d.name, email: d.email, phone: d.phone || "", company: "" });
  const who = acc.d;
  const startsAt = parisToDate(d.date, d.time), endsAt = new Date(startsAt.getTime() + kind.minutes * 60e3);
  const token = newToken();
  // le créneau est réservé tout de suite (personne d'autre ne peut le prendre) mais reste « en attente » jusqu'à validation dans l'administration
  const appt = await db.appointment.create({ data: { startsAt, endsAt, kind: kind.label, name: who.name || d.name, email: who.email, phone: who.phone || "", message: d.message || "", token, status: "en attente", clientId: acc.clientId } });
  await db.lead.create({ data: { name: who.name || d.name, email: who.email, phone: who.phone || "", projectType: `Rendez-vous : ${kind.label}`, message: d.message || "", consent: true, source: "rendez-vous", clientId: acc.clientId } });

  const s = await getSettings();
  const when = fmtLong(startsAt);
  const cancel = `${SITE_URL}/rendez-vous/annuler/${token}`;
  await Promise.all([
    sendMail({
      to: who.email, subject: `Demande de rendez-vous reçue : ${when}`,
      html: layout("Votre demande de rendez-vous est bien reçue", `<p style="line-height:1.6">Bonjour ${esc(who.name || d.name)},</p><p style="line-height:1.6"><strong>${esc(kind.label)}</strong><br>${esc(when)} (heure de Paris), durée ${kind.minutes} minutes.</p><p style="line-height:1.6">Ce créneau vous est réservé. Nous le validons rapidement et vous recevez alors un email de confirmation avec le fichier agenda. Vous pouvez aussi suivre votre demande dans votre espace client.</p><p style="font-size:13px">Annuler : ${cancel}</p>`),
    }),
    sendMail({ to: process.env.MAIL_TO || s.company.email, subject: `Rendez-vous à valider — ${who.name || d.name}, ${when}`, replyTo: who.email, html: layout("Rendez-vous à valider", `<p><strong>${esc(who.name || d.name)}</strong> · ${esc(who.email)}${who.phone ? " · " + esc(who.phone) : ""}</p><p>${esc(kind.label)} · ${esc(when)}</p>${d.message ? `<p style="white-space:pre-wrap">${esc(d.message)}</p>` : ""}<p><a href="${SITE_URL}/admin/rendez-vous">Valider ou refuser dans l'administration</a></p>`) }),
  ]);
  void appt;
  return NextResponse.json({ ok: true, when, kind: kind.label });
}

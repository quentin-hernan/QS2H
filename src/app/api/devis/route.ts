import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { withAccount } from "@/lib/lead-account";

export const runtime = "nodejs";

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // non configuré (dev)
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    return !!(await r.json()).success;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  const rl = rateLimit(`devis:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }
  // honeypot : un robot remplit le champ caché → on répond « ok » sans rien enregistrer
  if (typeof json === "object" && json && (json as { website?: string }).website) return NextResponse.json({ ok: true });

  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Certains champs sont invalides.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const acc = await withAccount(parsed.data);
  const d = acc.d;
  if (!(await verifyTurnstile(d.turnstileToken, ip))) return NextResponse.json({ ok: false, error: "La vérification anti-spam a échoué. Rechargez la page et réessayez." }, { status: 400 });

  await db.lead.create({ data: { name: d.name, email: d.email, phone: d.phone || "", company: d.company || "", projectType: d.projectType, budget: d.budget, deadline: d.deadline, message: d.message, consent: true, source: "formulaire devis", clientId: acc.clientId } });

  const s = await getSettings();
  const rows = [["Nom", d.name], ["Email", d.email], ["Téléphone", d.phone || "—"], ["Entreprise", d.company || "—"], ["Projet", d.projectType], ["Budget", d.budget], ["Délai", d.deadline]].map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5C5C56">${k}</td><td style="padding:6px 0"><strong>${esc(String(v))}</strong></td></tr>`).join("");
  await Promise.all([
    sendMail({ to: process.env.MAIL_TO || s.company.email, subject: `Nouvelle demande de devis — ${d.name}`, replyTo: d.email, html: layout("Nouvelle demande de devis", `<table>${rows}</table><p style="white-space:pre-wrap;line-height:1.6">${esc(d.message)}</p>`) }),
    sendMail({ to: d.email, subject: "Votre demande de devis QS2H a bien été reçue", html: layout("Merci, nous avons bien reçu votre demande", `<p style="line-height:1.6">Bonjour ${esc(d.name)},</p><p style="line-height:1.6">Nous étudions votre projet et revenons vers vous avec une première estimation sous 24 heures ouvrées (${esc(s.company.hours)}).</p><p style="line-height:1.6">Pour toute précision, répondez simplement à cet email.</p><p style="line-height:1.6">À très vite,<br>L'équipe QS2H</p>`) }),
  ]);
  return NextResponse.json({ ok: true });
}

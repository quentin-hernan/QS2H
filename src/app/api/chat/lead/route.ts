import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { parseJson } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  conversationId: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide.").max(200),
  phone: z.string().trim().max(30).regex(/^[0-9+().\s-]*$/, "Numéro invalide.").optional().or(z.literal("")),
  message: z.string().trim().min(5, "Précisez votre demande en quelques mots.").max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter le traitement de vos données." }) }),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

/** Un visiteur laisse ses coordonnées depuis le chatbot : création d'une demande dans l'admin + email à l'équipe. */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  if (!rateLimit(`chatlead:${ip}`, 4, 60 * 60 * 1000).ok) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Certains champs sont invalides.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  const lead = await db.lead.create({ data: { name: d.name, email: d.email, phone: d.phone || "", projectType: "Via l'assistant du site", message: d.message, consent: true, source: "chatbot" } });
  let transcript = "";
  if (d.conversationId) {
    const conv = await db.chatConversation.findUnique({ where: { id: d.conversationId } });
    if (conv) {
      await db.chatConversation.update({ where: { id: conv.id }, data: { leadId: lead.id, handoff: true } });
      transcript = parseJson<{ role: string; text: string }[]>(conv.messages, []).map((t) => `${t.role === "user" ? "Visiteur" : "Assistant"} : ${t.text}`).join("\n");
    }
  }
  const s = await getSettings();
  await Promise.all([
    sendMail({ to: process.env.MAIL_TO || s.company.email, subject: `Nouvelle demande via l'assistant — ${d.name}`, replyTo: d.email, html: layout("Demande reçue via l'assistant", `<p><strong>${esc(d.name)}</strong> · ${esc(d.email)}${d.phone ? " · " + esc(d.phone) : ""}</p><p style="white-space:pre-wrap;line-height:1.6">${esc(d.message)}</p>${transcript ? `<hr><p style="white-space:pre-wrap;color:#5C5C56;font-size:13px">${esc(transcript)}</p>` : ""}`) }),
    sendMail({ to: d.email, subject: "Votre message à QS2H a bien été reçu", html: layout("Merci, nous avons bien reçu votre message", `<p style="line-height:1.6">Bonjour ${esc(d.name)},</p><p style="line-height:1.6">Nous revenons vers vous sous 24 heures ouvrées (${esc(s.company.hours)}).</p><p style="line-height:1.6">À très vite,<br>L'équipe QS2H</p>`) }),
  ]);
  return NextResponse.json({ ok: true });
}

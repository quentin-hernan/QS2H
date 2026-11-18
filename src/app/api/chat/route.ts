import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { answerChat, getChatConfig, type ChatTurn } from "@/lib/chatbot";
import { parseJson } from "@/lib/utils";

export const runtime = "nodejs";

const body = z.object({
  id: z.string().max(40).optional(),
  message: z.string().trim().min(1).max(500),
  page: z.string().max(200).optional(),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

/** Configuration publique du widget (activé ? message d'accueil). */
export async function GET() {
  const c = await getChatConfig();
  return NextResponse.json({ enabled: c.enabled, name: c.name, welcome: c.welcome }, { headers: { "Cache-Control": "public, max-age=60" } });
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  if (!rateLimit(`chat:${ip}`, 30, 10 * 60 * 1000).ok) return NextResponse.json({ ok: false, error: "Trop de messages. Réessayez dans quelques minutes." }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Message invalide." }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true, id: "x", reply: "", quick: [], links: [], form: false });
  if (!(await getChatConfig()).enabled) return NextResponse.json({ ok: false, error: "Assistant indisponible." }, { status: 503 });

  const existing = d.id ? await db.chatConversation.findUnique({ where: { id: d.id } }) : null;
  const history = existing ? parseJson<ChatTurn[]>(existing.messages, []) : [];
  if (history.length >= 60) return NextResponse.json({ ok: false, error: "Conversation trop longue. Laissez vos coordonnées, nous vous répondrons." }, { status: 429 });
  history.push({ role: "user", text: d.message });
  const reply = await answerChat(history);
  history.push({ role: "bot", text: reply.reply });
  const data = { messages: JSON.stringify(history.map((t) => ({ ...t, at: undefined }))), page: (d.page || "").slice(0, 200) };
  const conv = existing ? await db.chatConversation.update({ where: { id: existing.id }, data }) : await db.chatConversation.create({ data });
  return NextResponse.json({ ok: true, id: conv.id, ...reply });
}

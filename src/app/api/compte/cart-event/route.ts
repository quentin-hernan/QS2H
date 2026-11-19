import { NextResponse } from "next/server";
import { getClient } from "@/lib/client-auth";
import { notifyAdmin } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Un client connecté ajoute un article au panier : l'administration est prévenue (une notification toutes les 20 s au plus). */
export async function POST(req: Request) {
  const c = await getClient();
  if (!c) return new NextResponse(null, { status: 204 });
  if (!rateLimit(`cart:${c.id}`, 1, 20_000).ok) return new NextResponse(null, { status: 204 });
  const b = (await req.json().catch(() => ({}))) as { title?: string; qty?: number };
  const title = String(b.title || "un article").slice(0, 120);
  await notifyAdmin({ kind: "panier", title: `${c.firstName} ${c.lastName} a ajouté « ${title} » au panier`, body: b.qty && b.qty > 1 ? `Quantité : ${b.qty}` : "", link: `/admin/clients/${c.id}` });
  return new NextResponse(null, { status: 204 });
}

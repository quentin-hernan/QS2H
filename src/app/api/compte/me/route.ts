import { NextResponse } from "next/server";
import { getClient } from "@/lib/client-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Coordonnées du client connecté (pour préremplir les formulaires). Renvoie `me: null` si personne n'est connecté. */
export async function GET() {
  const c = await getClient();
  return NextResponse.json({ ok: true, me: c ? { firstName: c.firstName, lastName: c.lastName, name: `${c.firstName} ${c.lastName}`.trim(), email: c.email, phone: c.phone, company: c.company } : null }, { headers: { "Cache-Control": "no-store" } });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Indique si une session d'administration valide existe (affiche l'éditeur visuel sur le site). Toujours 200, sans détail. */
export async function GET() {
  const s = await getSession();
  return NextResponse.json({ admin: !!s }, { headers: { "Cache-Control": "no-store" } });
}

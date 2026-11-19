import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Statistiques d'audience pour le tableau de bord (administrateurs uniquement). ?days=7|28|90 */
export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const d = Number(new URL(req.url).searchParams.get("days"));
  const days = [7, 28, 90].includes(d) ? d : 28;
  return NextResponse.json({ ok: true, data: await getAnalytics(days) }, { headers: { "Cache-Control": "no-store" } });
}

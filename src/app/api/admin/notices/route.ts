import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Notifications de l'administration : GET = 20 dernières + nombre non lues ; POST { all: true } ou { ids } = marquer comme lues. */
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const [items, unread] = await Promise.all([
    db.notice.findMany({ where: { audience: "admin" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notice.count({ where: { audience: "admin", readAt: null } }),
  ]);
  return NextResponse.json({ ok: true, items, unread }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { all?: boolean; ids?: string[] };
  const where = b.all ? { audience: "admin", readAt: null } : { audience: "admin", id: { in: (b.ids ?? []).slice(0, 50).map(String) } };
  await db.notice.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClient } from "@/lib/client-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Notifications du client connecté : GET = 20 dernières + non lues ; POST { all: true } ou { ids } = marquer comme lues. */
export async function GET() {
  const c = await getClient();
  if (!c) return NextResponse.json({ ok: false }, { status: 401 });
  const [items, unread] = await Promise.all([
    db.notice.findMany({ where: { audience: "client", clientId: c.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notice.count({ where: { audience: "client", clientId: c.id, readAt: null } }),
  ]);
  return NextResponse.json({ ok: true, items, unread }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: Request) {
  const c = await getClient();
  if (!c) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { all?: boolean; ids?: string[] };
  const base = { audience: "client", clientId: c.id };
  await db.notice.updateMany({ where: b.all ? { ...base, readAt: null } : { ...base, id: { in: (b.ids ?? []).slice(0, 50).map(String) } }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}

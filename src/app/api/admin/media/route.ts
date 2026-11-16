import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return NextResponse.json({ ok: true, media });
}

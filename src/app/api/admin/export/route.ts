import { NextResponse } from "next/server";
import { getSession, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Export complet des données (propriétaire uniquement). Les secrets (hash, 2FA) sont exclus. */
export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "owner") return NextResponse.json({ ok: false }, { status: 403 });
  const [settings, pages, services, projects, plans, options, faqs, reviews, posts, team, leads, media, redirects, users] = await Promise.all([
    db.setting.findMany(), db.pageContent.findMany(), db.service.findMany(), db.project.findMany(), db.plan.findMany(), db.planOption.findMany(), db.faq.findMany(),
    db.review.findMany(), db.post.findMany(), db.teamMember.findMany(), db.lead.findMany(), db.media.findMany(), db.redirect.findMany(),
    db.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } }),
  ]);
  await audit(s.email, "export complet", "export");
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), settings, pages, services, projects, plans, options, faqs, reviews, posts, team, leads, media, redirects, users }, null, 2);
  return new NextResponse(body, { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="qs2h-export-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}

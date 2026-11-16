import { notFound, permanentRedirect, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Redirections 301/302 gérées depuis /admin > SEO. Sinon : 404 personnalisée. */
export default async function CatchAll({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  const from = "/" + rest.join("/");
  const r = await db.redirect.findFirst({ where: { from: { in: [from, from + "/"] } } });
  if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
  notFound();
}

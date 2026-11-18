import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sections } from "@/components/Sections";
import { buildMetadata } from "@/lib/seo";
import { cleanSections } from "@/lib/sections";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

const find = (rest: string[]) => (rest.length === 1 ? db.customPage.findFirst({ where: { slug: rest[0], published: true } }) : Promise.resolve(null));

export async function generateMetadata({ params }: { params: Promise<{ rest: string[] }> }): Promise<Metadata> {
  const { rest } = await params;
  const p = await find(rest);
  return p ? buildMetadata({ title: p.title, description: p.description || p.title, path: `/${p.slug}` }) : {};
}

/** Pages libres créées dans /admin > Pages libres ; redirections 301/302 gérées depuis /admin > SEO ; sinon 404 personnalisée. */
export default async function CatchAll({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  const p = await find(rest);
  if (p) return <Sections title={p.title} sections={cleanSections(parseJson<unknown[]>(p.sections, []))} />;
  const from = "/" + rest.join("/");
  const r = await db.redirect.findFirst({ where: { from: { in: [from, from + "/"] } } });
  if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
  notFound();
}

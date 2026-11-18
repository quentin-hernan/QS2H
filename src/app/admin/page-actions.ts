"use server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { cleanSections } from "@/lib/sections";
import { slugify } from "@/lib/utils";

type Result = { ok: boolean; error?: string };
const RESERVED = new Set(["admin", "api", "compte", "services", "realisations", "tarifs", "methode", "a-propos", "blog", "faq", "contact", "rendez-vous", "catalogue", "mentions-legales", "politique-de-confidentialite", "politique-de-cookies", "cgv", "cgu", "newsletter", "sitemap.xml", "robots.txt"]);
const refresh = () => { revalidateTag("content"); revalidatePath("/", "layout"); };

export async function createCustomPage(formData: FormData) {
  const s = await requireSession();
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  if (!title) redirect("/admin/pages-libres?erreur=titre");
  let slug = slugify(title) || "page";
  if (RESERVED.has(slug)) slug += "-page";
  let n = 1; const base = slug;
  while (await db.customPage.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
  const p = await db.customPage.create({ data: { title, slug, sections: "[]" } });
  await audit(s.email, "création de page libre", "customPage", p.id);
  redirect(`/admin/pages-libres/${p.id}`);
}

const saveSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Adresse invalide : minuscules, chiffres et tirets uniquement.").max(80),
  description: z.string().trim().max(200),
  published: z.boolean(),
  sections: z.array(z.any()).max(40),
});

export async function saveCustomPage(id: string, data: unknown): Promise<Result> {
  const s = await requireSession();
  const parsed = saveSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Valeurs invalides." };
  const v = parsed.data;
  if (RESERVED.has(v.slug)) return { ok: false, error: "Cette adresse est déjà utilisée par une page du site." };
  const clash = await db.customPage.findFirst({ where: { slug: v.slug, NOT: { id } } });
  if (clash) return { ok: false, error: "Une autre page utilise déjà cette adresse." };
  const prev = await db.customPage.findUnique({ where: { id } });
  if (!prev) return { ok: false, error: "Page introuvable." };
  await db.customPage.update({ where: { id }, data: { title: v.title, slug: v.slug, description: v.description, published: v.published, sections: JSON.stringify(cleanSections(v.sections)) } });
  await audit(s.email, "modification de page libre", "customPage", id);
  refresh();
  revalidatePath(`/${prev.slug}`); revalidatePath(`/${v.slug}`);
  return { ok: true };
}

export async function deleteCustomPage(id: string) {
  const s = await requireSession();
  const p = await db.customPage.delete({ where: { id } }).catch(() => null);
  if (p) await audit(s.email, "suppression de page libre", "customPage", id);
  refresh();
  redirect("/admin/pages-libres");
}

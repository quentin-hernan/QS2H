import type { MetadataRoute } from "next";
import { getPosts, getProducts, getProjects, getServices, getShopItems } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { db } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts, products, shop] = await Promise.all([getServices(), getProjects(), getPosts(), getProducts(), getShopItems()]);
  const now = new Date();
  const custom = await db.customPage.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
  const fixed = ["", "/services", "/realisations", "/tarifs", "/methode", "/a-propos", "/blog", "/faq", "/contact", "/rendez-vous", "/boutique", "/mentions-legales", "/politique-de-confidentialite", "/cgv", "/cgv-boutique", "/cgu", "/politique-de-cookies"];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: p === "" ? 1 : p === "/contact" ? 0.9 : 0.7 })),
    ...(products.length ? [{ url: `${SITE_URL}/catalogue`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }] : []),
    ...products.map((p) => ({ url: `${SITE_URL}/catalogue/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...shop.map((p) => ({ url: `${SITE_URL}/boutique/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...custom.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...services.map((s) => ({ url: `${SITE_URL}/services/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/realisations/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}

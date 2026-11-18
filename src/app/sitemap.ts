import type { MetadataRoute } from "next";
import { getPosts, getProducts, getProjects, getServices } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts, products] = await Promise.all([getServices(), getProjects(), getPosts(), getProducts()]);
  const now = new Date();
  const fixed = ["", "/services", "/realisations", "/tarifs", "/methode", "/a-propos", "/blog", "/faq", "/contact", "/rendez-vous", "/mentions-legales", "/politique-de-confidentialite", "/cgv", "/politique-de-cookies"];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: p === "" ? 1 : p === "/contact" ? 0.9 : 0.7 })),
    ...(products.length ? [{ url: `${SITE_URL}/catalogue`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }] : []),
    ...products.map((p) => ({ url: `${SITE_URL}/catalogue/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...services.map((s) => ({ url: `${SITE_URL}/services/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/realisations/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}

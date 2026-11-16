import { unstable_cache } from "next/cache";
import { db } from "./db";
import { defaultSettings, pageDefaults, type SiteSettings } from "./defaults";
import { parseJson } from "./utils";

const TAG = "content";
const cached = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) =>
  unstable_cache(fn, ["qs2h", key], { tags: [TAG], revalidate: 3600 });

type Faq = { q: string; a: string };
type Result = { label: string; value: string };
export type PlaneT = { id: string; name: string; kind: "nav" | "hero" | "section" | "footer" | "mobile" | "tablet" | "autre"; image: string; caption: string; depth: number };
export type ProjectMeta = {
  capturedAt?: string; title?: string; description?: string; h1?: string[]; headings?: Record<string, number>; technologies?: string[];
  lighthouse?: { performance: number; accessibility: number; bestPractices: number; seo: number; source: string } | null;
};

export type ServiceT = Awaited<ReturnType<typeof loadServices>>[number];
export type ProjectT = Awaited<ReturnType<typeof loadProjects>>[number];
export type PostT = Awaited<ReturnType<typeof loadPosts>>[number];

function deepMerge<T extends Record<string, unknown>>(base: T, over: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined && v !== null) out[k] = v;
  }
  return out as T;
}

async function loadSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany();
  const s: SiteSettings = structuredClone(defaultSettings);
  for (const r of rows) {
    const v = parseJson<unknown>(r.value, null);
    if (v === null) continue;
    (s as Record<string, unknown>)[r.key] = Array.isArray(v) ? v : typeof v === "object" ? deepMerge((s as Record<string, any>)[r.key] ?? {}, v as Record<string, unknown>) : v; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return s;
}
export const getSettings = cached(loadSettings, "settings");

async function loadPage(key: string) {
  const row = await db.pageContent.findUnique({ where: { key } });
  const base = pageDefaults[key] ?? {};
  return deepMerge(base, parseJson<Record<string, unknown>>(row?.body, {})) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export const getPage = cached(loadPage, "page");

async function loadServices() {
  const rows = await db.service.findMany({ where: { published: true }, orderBy: { order: "asc" } });
  return rows.map((s) => ({ ...s, deliverables: parseJson<string[]>(s.deliverables, []), faq: parseJson<Faq[]>(s.faq, []) }));
}
export const getServices = cached(loadServices, "services");

async function loadProjects() {
  const rows = await db.project.findMany({ where: { status: "published" }, orderBy: { order: "asc" } });
  return rows.map((p) => ({
    ...p,
    services: parseJson<string[]>(p.services, []),
    results: parseJson<Result[]>(p.results, []),
    technologies: parseJson<string[]>(p.technologies, []),
    images: parseJson<string[]>(p.images, []),
    planes: (() => { const v = parseJson<PlaneT[]>(p.planes, []); return Array.isArray(v) ? v : []; })(),
    meta: parseJson<ProjectMeta>(p.meta, {}),
  }));
}
const cachedProjects = cached(loadProjects, "projects");
/** unstable_cache sérialise en JSON : on reconstruit les dates. */
export async function getProjects() {
  return (await cachedProjects()).map((p) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }));
}

async function loadPlans() {
  const [plans, options] = await Promise.all([db.plan.findMany({ orderBy: { order: "asc" } }), db.planOption.findMany({ orderBy: { order: "asc" } })]);
  return { plans: plans.map((p) => ({ ...p, features: parseJson<string[]>(p.features, []) })), options };
}
export const getPlans = cached(loadPlans, "plans");

export const getFaqs = cached(async () => db.faq.findMany({ orderBy: { order: "asc" } }), "faqs");
export const getReviews = cached(async () => db.review.findMany({ where: { visible: true }, orderBy: { order: "asc" } }), "reviews");
export const getTeam = cached(async () => db.teamMember.findMany({ orderBy: { order: "asc" } }), "team");

async function loadPosts() {
  const rows = await db.post.findMany({
    where: { status: "published", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
  });
  return rows;
}
const cachedPosts = cached(loadPosts, "posts");
export async function getPosts() {
  return (await cachedPosts()).map((p) => ({ ...p, publishedAt: p.publishedAt ? new Date(p.publishedAt) : null, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }));
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}
export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}
export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

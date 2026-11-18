import sharp from "sharp";
import { assertPublicUrl, isPrivateIp } from "./ssrf";
import dns from "node:dns/promises";
import net from "node:net";

export type PlaneKind = "nav" | "hero" | "section" | "footer" | "mobile" | "tablet" | "autre";
export type Plane = { id: string; name: string; kind: PlaneKind; image: string; caption: string; depth: number };
export type CaptureMeta = {
  capturedAt: string;
  url: string;
  title: string;
  description: string;
  h1: string[];
  headings: Record<string, number>;
  lang: string;
  technologies: string[];
  lighthouse: { performance: number; accessibility: number; bestPractices: number; seo: number; source: string } | null;
  siteName?: string;
  ogTitle?: string;
  ogDescription?: string;
};
export type RawPlane = Omit<Plane, "image" | "id"> & { png: Buffer };
export type Captured = { planes: RawPlane[]; meta: CaptureMeta; cover?: Buffer };

const NAV_TIMEOUT = 30_000;
const MAX_PAGE_H = 14_000;
const MAX_SECTIONS = 7;

/** Détection simple et vérifiable à partir du HTML et des ressources chargées. */
function detectTech(html: string, scripts: string[], generator: string): string[] {
  const t = new Set<string>();
  const all = scripts.join(" ") + " " + html.slice(0, 200_000);
  if (/__NEXT_DATA__|\/_next\//.test(all)) t.add("Next.js");
  if (/__NUXT__|\/_nuxt\//.test(all)) t.add("Nuxt");
  if (/wp-content|wp-includes/.test(all) || /wordpress/i.test(generator)) t.add("WordPress");
  if (/cdn\.shopify\.com|Shopify\.theme/.test(all)) t.add("Shopify");
  if (/wixstatic|wix\.com/.test(all)) t.add("Wix");
  if (/squarespace/i.test(all)) t.add("Squarespace");
  if (/webflow/i.test(all) || /webflow/i.test(generator)) t.add("Webflow");
  if (/astro/i.test(generator)) t.add("Astro");
  if (/gatsby/i.test(all)) t.add("Gatsby");
  if (/prestashop/i.test(all) || /prestashop/i.test(generator)) t.add("PrestaShop");
  if (/data-reactroot|react(\.|-dom)/i.test(all)) t.add("React");
  if (/vue(\.|@)|__vue/i.test(all)) t.add("Vue");
  if (/jquery/i.test(all)) t.add("jQuery");
  if (/googletagmanager|gtag\(/.test(all)) t.add("Google Tag Manager");
  if (/plausible\.io/.test(all)) t.add("Plausible");
  if (generator && t.size === 0) t.add(generator.slice(0, 40));
  return [...t];
}

async function lighthouse(url: string): Promise<CaptureMeta["lighthouse"]> {
  try {
    const key = process.env.PSI_API_KEY ? `&key=${encodeURIComponent(process.env.PSI_API_KEY)}` : "";
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo${key}`;
    const r = await fetch(api, { signal: AbortSignal.timeout(60_000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { lighthouseResult?: { categories?: Record<string, { score: number | null }> } };
    const c = j.lighthouseResult?.categories;
    if (!c) return null;
    const p = (k: string) => Math.round((c[k]?.score ?? 0) * 100);
    return { performance: p("performance"), accessibility: p("accessibility"), bestPractices: p("best-practices"), seo: p("seo"), source: "Google PageSpeed Insights (mobile)" };
  } catch {
    return null;
  }
}

/**
 * Capture une page publique avec un navigateur headless. Les adresses internes sont refusées avant la navigation
 * ET pour chaque requête sortante du navigateur (redirections, sous-ressources).
 * `trusted` n'est utilisé que par les scripts locaux de démonstration (fichiers du dépôt).
 */
export async function captureSite(rawUrl: string, opts: { trusted?: boolean; psi?: boolean } = {}): Promise<Captured> {
  const trusted = !!opts.trusted;
  const url = trusted ? new URL(rawUrl) : await assertPublicUrl(rawUrl);
  const { chromium } = await import("playwright-core");
  // navigateur fourni par Playwright, sinon Chrome ou Edge installés sur la machine
  const tries: (string | undefined)[] = [process.env.CAPTURE_BROWSER_CHANNEL || undefined, undefined, "chrome", "msedge"];
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let lastErr: unknown = null;
  for (const channel of tries) {
    try { browser = await chromium.launch({ args: ["--disable-dev-shm-usage"], ...(channel ? { channel } : {}) }); break; } catch (e) { lastErr = e; }
  }
  if (!browser) throw new Error("Aucun navigateur disponible pour la capture (installez Chrome, ou lancez « npx playwright install chromium »). " + String((lastErr as Error)?.message ?? "").slice(0, 80));
  const hostOk = new Map<string, boolean>();
  async function allowed(u: URL) {
    if (trusted) return true;
    if (!["http:", "https:", "data:", "blob:"].includes(u.protocol)) return false;
    if (u.protocol === "data:" || u.protocol === "blob:") return true;
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (hostOk.has(host)) return hostOk.get(host)!;
    let ok = false;
    try {
      const addrs = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((a) => a.address);
      ok = addrs.length > 0 && !addrs.some(isPrivateIp);
    } catch { ok = false; }
    hostOk.set(host, ok);
    return ok;
  }
  try {
    const open = async (width: number, height: number, mobile = false) => {
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, javaScriptEnabled: true, acceptDownloads: false, serviceWorkers: "block", userAgent: "QS2H-Capture/1.0 (+https://qs2h.fr)" });
      await ctx.addInitScript("window.__name = window.__name || ((f) => f);"); // helper injecté par esbuild/tsx dans les fonctions évaluées
      await ctx.route("**/*", async (route) => {
        const req = route.request();
        let ok = false;
        try { ok = await allowed(new URL(req.url())); } catch { ok = false; }
        if (!ok) return route.abort("blockedbyclient");
        if (["media", "websocket", "eventsource"].includes(req.resourceType())) return route.abort();
        return route.continue();
      });
      const page = await ctx.newPage();
      page.setDefaultTimeout(NAV_TIMEOUT);
      const resp = await page.goto(url.toString(), { waitUntil: "load", timeout: NAV_TIMEOUT });
      if (!resp || !resp.ok()) throw new Error(`Le site a répondu avec une erreur (${resp?.status() ?? "aucune réponse"}).`);
      if (!trusted) { const fin = new URL(page.url()); if (!(await allowed(fin))) throw new Error("Redirection vers une adresse interne refusée."); }
      await page.waitForTimeout(900);
      // Déclenche le chargement paresseux en parcourant la page
      await page.evaluate(async (maxH) => {
        const h = Math.min(document.documentElement.scrollHeight, maxH);
        for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
        window.scrollTo(0, 0);
      }, MAX_PAGE_H);
      await page.waitForTimeout(500);
      return { ctx, page };
    };

    // ---- Bureau 1440 px : captures par sections
    const d = await open(1440, 900);
    const info = await d.page.evaluate((maxSections) => {
      const abs = (el: Element) => { const r = el.getBoundingClientRect(); return { x: 0, y: Math.round(r.top + scrollY), w: Math.round(innerWidth), h: Math.round(r.height), tag: el.tagName.toLowerCase() }; };
      const txt = (el: Element) => (el.getAttribute("aria-label") || el.querySelector("h1,h2,h3")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70);
      const rects: { y: number; h: number; tag: string; label: string; kind: string }[] = [];
      const header = document.querySelector("body header, body > nav, [role=banner]");
      const footer = document.querySelector("body footer, [role=contentinfo]");
      const main = document.querySelector("main") || document.body;
      let secs = Array.from(main.querySelectorAll(":scope > section, :scope > div > section, :scope > article")).filter((e) => e.getBoundingClientRect().height > 120);
      if (!secs.length) secs = Array.from(main.children).filter((e) => e.getBoundingClientRect().height > 160 && !["SCRIPT", "STYLE", "HEADER", "FOOTER"].includes(e.tagName));
      if (header) { const a = abs(header); if (a.h > 20) rects.push({ ...a, label: "Navigation", kind: "nav" }); }
      secs.slice(0, maxSections).forEach((s, i) => { const a = abs(s); rects.push({ ...a, label: txt(s) || `Section ${i + 1}`, kind: i === 0 ? "hero" : "section" }); });
      if (footer) { const a = abs(footer); if (a.h > 20) rects.push({ ...a, label: "Pied de page", kind: "footer" }); }
      const hn: Record<string, number> = {};
      for (const l of ["h1", "h2", "h3", "h4", "h5", "h6"]) hn[l] = document.querySelectorAll(l).length;
      return {
        rects,
        total: document.documentElement.scrollHeight,
        html: document.documentElement.outerHTML.slice(0, 250_000),
        scripts: Array.from(document.scripts).map((s) => s.src).filter(Boolean),
        generator: document.querySelector('meta[name="generator"]')?.getAttribute("content") || "",
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
        h1: Array.from(document.querySelectorAll("h1")).map((h) => (h.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 5),
        hn,
        lang: document.documentElement.lang || "",
        siteName: document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "",
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
        ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      };
    }, MAX_SECTIONS);
    const pageH = Math.min(info.total, MAX_PAGE_H);
    const full = await d.page.screenshot({ fullPage: true, type: "png", clip: { x: 0, y: 0, width: 1440, height: pageH } });
    await d.ctx.close();
    const cover = await sharp(full).extract({ left: 0, top: 0, width: 1440, height: Math.min(900, pageH) }).png().toBuffer();

    const planes: RawPlane[] = [];
    let rects = info.rects.filter((r) => r.y < pageH && r.h > 20).sort((a, b) => a.y - b.y);
    if (rects.length < 2) {
      // Repli : découpe régulière
      const step = 900;
      rects = Array.from({ length: Math.min(MAX_SECTIONS, Math.ceil(pageH / step)) }, (_, i) => ({ y: i * step, h: Math.min(step, pageH - i * step), tag: "div", label: i === 0 ? "Accueil" : `Section ${i + 1}`, kind: i === 0 ? "hero" : "section" }));
    }
    for (const r of rects) {
      const top = Math.max(0, r.y), h = Math.min(r.h, pageH - top, 1600);
      if (h < 20) continue;
      const png = await sharp(full).extract({ left: 0, top, width: 1440, height: h }).png().toBuffer();
      const kind = (r.kind as PlaneKind);
      planes.push({ name: r.label, kind, caption: "", depth: planes.length, png });
    }

    // ---- Tablette puis mobile : première vue
    const t = await open(820, 1100);
    const tablet = await t.page.screenshot({ type: "png" }); await t.ctx.close();
    const m = await open(390, 844, true);
    const mobile = await m.page.screenshot({ type: "png" }); await m.ctx.close();
    planes.push({ name: "Version tablette", kind: "tablet", caption: "", depth: planes.length, png: tablet });
    planes.push({ name: "Version mobile", kind: "mobile", caption: "", depth: planes.length, png: mobile });

    const meta: CaptureMeta = {
      capturedAt: new Date().toISOString(),
      url: url.toString(),
      title: info.title, description: info.description, h1: info.h1, headings: info.hn, lang: info.lang,
      siteName: info.siteName, ogTitle: info.ogTitle, ogDescription: info.ogDescription,
      technologies: detectTech(info.html, info.scripts, info.generator),
      lighthouse: opts.psi === false || trusted ? null : await lighthouse(url.toString()),
    };
    return { planes, meta, cover };
  } finally {
    await browser.close();
  }
}


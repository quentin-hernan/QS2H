import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Mesure d'audience interne. Envoyée par le navigateur uniquement si le visiteur a accepté la mesure d'audience.
 * - Aucune IP, aucun cookie : l'empreinte du visiteur est un hachage (IP + navigateur + sel du jour) qui change chaque jour.
 * - POST { p, r, w, s } : nouvelle page vue → { id }   ·   POST { id, d } : durée passée sur la page (secondes).
 */
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|curl|wget|python|axios|monitor/i;
const SOURCES: [RegExp, string][] = [
  [/google\./, "Google"], [/bing\./, "Bing"], [/duckduckgo\./, "DuckDuckGo"], [/qwant\./, "Qwant"], [/ecosia\./, "Ecosia"], [/yahoo\./, "Yahoo"],
  [/facebook\.|fb\.com|messenger\./, "Facebook"], [/instagram\./, "Instagram"], [/linkedin\.|lnkd\.in/, "LinkedIn"], [/t\.co$|twitter\.|x\.com/, "X (Twitter)"],
  [/tiktok\./, "TikTok"], [/pinterest\./, "Pinterest"], [/youtube\.|youtu\.be/, "YouTube"], [/chatgpt\.|openai\./, "ChatGPT"],
];
const device = (ua: string, w: number) => (/ipad|tablet/i.test(ua) || (w >= 600 && w < 1024 && /mobile|android/i.test(ua)) ? "Tablette" : /mobi|iphone|android/i.test(ua) || (w > 0 && w < 600) ? "Mobile" : "Ordinateur");
const browser = (ua: string) => (/edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /firefox|fxios/i.test(ua) ? "Firefox" : /samsungbrowser/i.test(ua) ? "Samsung Internet" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Autre");
function country(h: Headers) {
  const direct = h.get("x-country") || h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
  if (direct) return direct.toUpperCase().slice(0, 2);
  const geo = h.get("x-nf-geo"); // Netlify : JSON encodé en base64
  if (geo) { try { const j = JSON.parse(Buffer.from(geo, "base64").toString("utf8")); return String(j?.country?.code || "").toUpperCase().slice(0, 2); } catch { /* */ } }
  return "";
}

export async function POST(req: Request) {
  const h = req.headers;
  const ua = h.get("user-agent") || "";
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
  if (BOT.test(ua) || !rateLimit(`a:${ip}`, 120, 60_000).ok) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { p?: string; r?: string; w?: number; s?: string; id?: string; d?: number } | null;
  if (!body) return new NextResponse(null, { status: 204 });

  // durée passée sur une page déjà enregistrée
  if (body.id && typeof body.d === "number") {
    const d = Math.max(0, Math.min(1800, Math.round(body.d)));
    await db.pageView.updateMany({ where: { id: String(body.id).slice(0, 40), at: { gte: new Date(Date.now() - 2 * 3600e3) } }, data: { duration: d } }).catch(() => null);
    return new NextResponse(null, { status: 204 });
  }

  const path = String(body.p || "/").split("?")[0].slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const visitor = crypto.createHash("sha256").update(`${day}|${process.env.AUTH_SECRET || "qs2h"}|${ip}|${ua}`).digest("base64url").slice(0, 18);

  // nouvelle visite après 30 minutes sans page vue
  const last = await db.pageView.findFirst({ where: { visitor, at: { gte: new Date(Date.now() - 30 * 60e3) } }, orderBy: { at: "desc" }, select: { session: true } });
  const session = last?.session ?? crypto.randomBytes(9).toString("base64url");

  let referrer = "", source = "Direct";
  try {
    const host = new URL(String(body.r || "")).hostname.replace(/^www\./, "");
    const self = new URL(req.url).hostname.replace(/^www\./, "");
    if (host && host !== self) { referrer = host.slice(0, 120); source = SOURCES.find(([re]) => re.test(host))?.[1] ?? host.slice(0, 60); }
  } catch { /* pas de référent */ }
  if (body.s) source = String(body.s).slice(0, 60); // utm_source
  if (last && !body.s) source = (await db.pageView.findFirst({ where: { session }, orderBy: { at: "asc" }, select: { source: true } }))?.source ?? source; // la source reste celle du début de visite

  const v = await db.pageView.create({ data: { path, visitor, session, referrer, source, device: device(ua, Number(body.w) || 0), browser: browser(ua), country: country(h) }, select: { id: true } });
  return NextResponse.json({ id: v.id });
}

import "server-only";
import { saveImage } from "./media";
import type { Captured, CaptureMeta, Plane, PlaneKind, RawPlane } from "./capture-core";
export { captureSite } from "./capture-core";
export type { Captured, CaptureMeta, Plane, PlaneKind, RawPlane } from "./capture-core";

const DEFAULT_CAPTIONS: Record<PlaneKind, string> = {
  nav: "Navigation : accès rapide aux pages clés et appel à l'action toujours visible.",
  hero: "Section d'accueil : la promesse et l'action principale, lisibles dès l'arrivée.",
  section: "Section de contenu : une idée par bloc, hiérarchie claire.",
  footer: "Pied de page : coordonnées, navigation secondaire et mentions légales.",
  mobile: "Version mobile : la même hiérarchie, pensée pour le pouce.",
  tablet: "Version tablette : la mise en page s'adapte à la largeur.",
  autre: "",
};

/** Enregistre les captures dans la médiathèque et retourne les plans prêts à être édités. */
export async function storeCapture(c: Captured, projectTitle: string): Promise<{ planes: Plane[]; meta: CaptureMeta; cover: string }> {
  const planes: Plane[] = [];
  for (const [i, p] of c.planes.entries()) {
    const maxW = p.kind === "mobile" ? 780 : 1600;
    const m = await saveImage(p.png, `${projectTitle}-${p.kind}-${i + 1}`, `${p.name} — ${projectTitle}`, maxW);
    planes.push({ id: `p${Date.now().toString(36)}${i}`, name: p.name, kind: p.kind, image: m.url, caption: p.caption || DEFAULT_CAPTIONS[p.kind], depth: p.depth });
  }
  const cover = c.cover ? (await saveImage(c.cover, `${projectTitle}-couverture`, `Page d'accueil du site ${c.meta.siteName || c.meta.title || projectTitle}`, 1600)).url : planes.find((p) => p.kind === "hero")?.image ?? "";
  return { planes, meta: c.meta, cover };
}

/** Capture déléguée à un worker externe (Docker sur Railway / Fly.io…) si CAPTURE_WORKER_URL est défini. */
export async function captureViaWorker(url: string): Promise<Captured> {
  const base = process.env.CAPTURE_WORKER_URL!;
  const r = await fetch(base.replace(/\/$/, "") + "/capture", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.CAPTURE_WORKER_TOKEN ?? ""}` },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) throw new Error("Le service de capture a refusé la demande.");
  const j = (await r.json()) as { meta: CaptureMeta; cover?: string; planes: (Omit<RawPlane, "png"> & { png: string })[] };
  return { meta: j.meta, cover: j.cover ? Buffer.from(j.cover, "base64") : undefined, planes: j.planes.map((p) => ({ ...p, png: Buffer.from(p.png, "base64") })) };
}

/**
 * Capture sans navigateur ni serveur à déployer : un service de capture public (Microlink, gratuit sans clé, quota limité)
 * prend la page en entier ; on la découpe ici en plans (navigation, accueil, sections, pied de page) + une vue mobile.
 * MICROLINK_API_KEY (facultative) lève le quota gratuit.
 */
export async function captureViaService(url: string): Promise<Captured> {
  const sharp = (await import("sharp")).default;
  const call = async (q: Record<string, string>) => {
    const p = new URLSearchParams({ url, screenshot: "true", meta: "true", ...q });
    const r = await fetch(`https://api.microlink.io/?${p}`, { headers: process.env.MICROLINK_API_KEY ? { "x-api-key": process.env.MICROLINK_API_KEY } : {}, signal: AbortSignal.timeout(60_000) });
    const j = (await r.json().catch(() => null)) as { status?: string; message?: string; data?: { title?: string; description?: string; lang?: string; publisher?: string; screenshot?: { url?: string } } } | null;
    if (!j || j.status !== "success" || !j.data?.screenshot?.url) throw new Error(r.status === 429 ? "Quota du service de capture atteint pour aujourd'hui, réessayez demain ou ajoutez les images à la main." : "Le service de capture n'a pas pu ouvrir ce site.");
    const shot = new URL(j.data.screenshot.url);
    if (shot.protocol !== "https:") throw new Error("Capture invalide.");
    const img = await fetch(shot, { signal: AbortSignal.timeout(60_000) });
    if (!img.ok) throw new Error("Capture illisible.");
    return { data: j.data, png: Buffer.from(await img.arrayBuffer()) };
  };
  // repli si le quota Microlink est atteint : thum.io (page entière, sans clé), titre et description lus dans le HTML de la page
  const viaThum = async () => {
    const img = await fetch(`https://image.thum.io/get/fullpage/width/1440/wait/4/noanimate/${url}`, { signal: AbortSignal.timeout(90_000) });
    if (!img.ok || !(img.headers.get("content-type") || "").startsWith("image/png")) throw new Error("Le service de capture n'a pas pu ouvrir ce site.");
    const html = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { "user-agent": "QS2H-Capture/1.0" } }).then((r) => r.text()).catch(() => "");
    const pick = (re: RegExp) => (re.exec(html)?.[1] || "").replace(/s+/g, " ").trim();
    return { data: { title: pick(/<title[^>]*>([^<]*)</i), description: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i), lang: pick(/<html[^>]+lang=["']([^"']*)/i), publisher: pick(/property=["']og:site_name["'][^>]+content=["']([^"']*)/i) }, png: Buffer.from(await img.arrayBuffer()) };
  };
  const [desk, mob] = await Promise.all([
    call({ fullPage: "true", "viewport.width": "1440", "viewport.height": "900", waitForTimeout: "2500" }).catch((e: Error) => (/Quota|capture/.test(e.message) ? viaThum() : Promise.reject(e))),
    call({ "viewport.width": "390", "viewport.height": "844", "viewport.isMobile": "true", "viewport.hasTouch": "true", "viewport.deviceScaleFactor": "2", waitForTimeout: "2000" }).catch(() => null),
  ]);
  const meta0 = await sharp(desk.png, { limitInputPixels: 400_000_000 }).metadata();
  const scale = (meta0.width || 1440) / 1440;
  const pageH = Math.min(Math.round((meta0.height || 900) / scale), 14_000);
  const cut = async (top: number, h: number) => {
    const t = Math.round(top * scale), hh = Math.min(Math.round(h * scale), (meta0.height || 0) - t);
    return hh > 20 ? sharp(desk.png, { limitInputPixels: 400_000_000 }).extract({ left: 0, top: t, width: meta0.width || 1440, height: hh }).resize({ width: 1440 }).png().toBuffer() : null;
  };
  const planes: RawPlane[] = [];
  const add = async (name: string, kind: PlaneKind, top: number, h: number) => { const png = await cut(top, h); if (png) planes.push({ name, kind, caption: "", depth: planes.length, png }); };
  const NAV = 90, FOOT = pageH > 2400 ? 520 : 0;
  await add("Navigation", "nav", 0, NAV);
  await add("Accueil", "hero", NAV, Math.min(820, pageH - NAV));
  const end = pageH - FOOT;
  for (let y = NAV + 820, i = 1; y < end - 120 && i <= 5; y += 900, i++) await add(`Section ${i}`, "section", y, Math.min(900, end - y));
  if (FOOT) await add("Pied de page", "footer", pageH - FOOT, FOOT);
  if (mob) planes.push({ name: "Version mobile", kind: "mobile", caption: "", depth: planes.length, png: await sharp(mob.png).resize({ width: 780 }).png().toBuffer() });
  const cover = await cut(0, 900) ?? undefined;
  const d = desk.data;
  return { planes, cover, meta: { capturedAt: new Date().toISOString(), url, title: d.title || "", description: d.description || "", h1: d.title ? [d.title] : [], headings: {}, lang: d.lang || "", technologies: [], lighthouse: null, siteName: d.publisher || "" } };
}

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
export async function storeCapture(c: Captured, projectTitle: string): Promise<{ planes: Plane[]; meta: CaptureMeta }> {
  const planes: Plane[] = [];
  for (const [i, p] of c.planes.entries()) {
    const maxW = p.kind === "mobile" ? 780 : 1600;
    const m = await saveImage(p.png, `${projectTitle}-${p.kind}-${i + 1}`, `${p.name} — ${projectTitle}`, maxW);
    planes.push({ id: `p${Date.now().toString(36)}${i}`, name: p.name, kind: p.kind, image: m.url, caption: p.caption || DEFAULT_CAPTIONS[p.kind], depth: p.depth });
  }
  return { planes, meta: c.meta };
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
  const j = (await r.json()) as { meta: CaptureMeta; planes: (Omit<RawPlane, "png"> & { png: string })[] };
  return { meta: j.meta, planes: j.planes.map((p) => ({ ...p, png: Buffer.from(p.png, "base64") })) };
}

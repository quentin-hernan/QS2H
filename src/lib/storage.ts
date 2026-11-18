import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des fichiers.
 * - Production : Supabase Storage (buckets « uploads » PUBLIC et « documents » PRIVÉ), via l'API REST (aucune dépendance).
 * - Développement (variables absentes) : disque local (public/uploads et storage/documents).
 */
const URL_ = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
const remote = !!(URL_ && KEY);
// Hébergement serverless (Netlify, Vercel) : le disque est en lecture seule, un stockage distant est obligatoire.
const readOnlyHost = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const needRemote = () => { if (!remote && readOnlyHost) throw new Error("STORAGE_NOT_CONFIGURED"); };
const PUBLIC_BUCKET = "uploads";
const PRIVATE_BUCKET = "documents";
// Anciennes clés (JWT « eyJ… ») : en-tête Authorization requis ; nouvelles clés « sb_secret_… » : apikey seul.
const auth: Record<string, string> = KEY.startsWith("eyJ") ? { Authorization: `Bearer ${KEY}`, apikey: KEY } : { apikey: KEY };

const safe = (name: string) => path.basename(name);

async function put(bucket: string, name: string, data: Buffer, type: string) {
  const r = await fetch(`${URL_}/storage/v1/object/${bucket}/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": type || "application/octet-stream", "x-upsert": "true" },
    body: new Uint8Array(data),
  });
  if (!r.ok) throw new Error(`STORAGE ${r.status}`);
}

/** Enregistre un fichier public et renvoie son URL. */
export async function putPublic(name: string, data: Buffer, type: string): Promise<string> {
  needRemote();
  name = safe(name);
  if (remote) {
    await put(PUBLIC_BUCKET, name, data, type);
    return `${URL_}/storage/v1/object/public/${PUBLIC_BUCKET}/${encodeURIComponent(name)}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), data);
  return `/uploads/${name}`;
}

/** Supprime un fichier public à partir de son URL (sans effet pour une URL externe). */
export async function removePublic(url: string) {
  if (remote && url.startsWith(`${URL_}/storage/v1/object/public/${PUBLIC_BUCKET}/`)) {
    const name = decodeURIComponent(url.split("/").pop() || "");
    await fetch(`${URL_}/storage/v1/object/${PUBLIC_BUCKET}/${encodeURIComponent(name)}`, { method: "DELETE", headers: auth }).catch(() => {});
  } else if (url.startsWith("/uploads/")) {
    await fs.unlink(path.join(process.cwd(), "public", "uploads", safe(url))).catch(() => {});
  }
}

export async function putPrivate(name: string, data: Buffer, type: string) {
  needRemote();
  name = safe(name);
  if (remote) return put(PRIVATE_BUCKET, name, data, type);
  const dir = path.join(process.cwd(), "storage", "documents");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), data);
}

export async function getPrivate(name: string): Promise<Buffer> {
  name = safe(name);
  if (remote) {
    const r = await fetch(`${URL_}/storage/v1/object/${PRIVATE_BUCKET}/${encodeURIComponent(name)}`, { headers: auth, cache: "no-store" });
    if (!r.ok) throw new Error(`STORAGE ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return fs.readFile(path.join(process.cwd(), "storage", "documents", name));
}

export async function removePrivate(name: string) {
  name = safe(name);
  if (remote) await fetch(`${URL_}/storage/v1/object/${PRIVATE_BUCKET}/${encodeURIComponent(name)}`, { method: "DELETE", headers: auth }).catch(() => {});
  else await fs.rm(path.join(process.cwd(), "storage", "documents", name), { force: true });
}

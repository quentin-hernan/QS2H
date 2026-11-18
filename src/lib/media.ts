import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "./db";
import { slugify } from "./utils";

/**
 * Enregistre une image : contrôle du contenu réel, rotation EXIF, redimensionnement, conversion WebP.
 * En production serverless, remplacer l'écriture disque par un stockage objet (R2 / Supabase) ici uniquement.
 */
export async function saveImage(buf: Buffer, baseName: string, alt: string, maxWidth = 2400) {
  const meta = await sharp(buf).metadata();
  if (!meta.format || !["jpeg", "png", "webp", "avif", "gif"].includes(meta.format)) throw new Error("FORMAT");
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${slugify(baseName.replace(/\.[^.]+$/, "")) || "image"}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const out = await sharp(buf, { animated: meta.format === "gif" }).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, name));
  return db.media.create({ data: { filename: name, url: `/uploads/${name}`, alt: alt.slice(0, 300), width: out.width, height: out.height, size: out.size, kind: "image", mime: "image/webp" } });
}

const VIDEO_TYPES: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", ogv: "video/ogg" };
/** Identifie une vidéo par son contenu réel (signature binaire), pas par son extension. */
export function sniffVideo(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 16) return null;
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("latin1");
    return brand.startsWith("qt") ? { ext: "mov", mime: VIDEO_TYPES.mov } : { ext: "mp4", mime: VIDEO_TYPES.mp4 };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { ext: "webm", mime: VIDEO_TYPES.webm };
  if (buf.subarray(0, 4).toString("latin1") === "OggS") return { ext: "ogv", mime: VIDEO_TYPES.ogv };
  return null;
}
/** Enregistre une vidéo (MP4, WebM, MOV, OGV) telle quelle : le navigateur la lit directement. */
export async function saveVideo(buf: Buffer, baseName: string, alt: string) {
  const v = sniffVideo(buf);
  if (!v) throw new Error("FORMAT");
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${slugify(baseName.replace(/\.[^.]+$/, "")) || "video"}.${v.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return db.media.create({ data: { filename: name, url: `/uploads/${name}`, alt: alt.slice(0, 300), size: buf.length, kind: "video", mime: v.mime } });
}

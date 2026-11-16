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
  const out = await sharp(buf).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, name));
  return db.media.create({ data: { filename: name, url: `/uploads/${name}`, alt: alt.slice(0, 300), width: out.width, height: out.height, size: out.size } });
}

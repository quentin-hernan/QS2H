import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveImage } from "@/lib/media";

export const runtime = "nodejs";
const MAX = 12 * 1024 * 1024;

/** Upload d'image : validation du contenu réel, redimensionnement, conversion WebP, texte alternatif obligatoire. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  const alt = String(fd.get("alt") || "").trim();
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Aucun fichier." }, { status: 400 });
  if (!alt) return NextResponse.json({ ok: false, error: "Le texte alternatif est obligatoire (accessibilité et SEO)." }, { status: 422 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "Fichier trop lourd (12 Mo maximum)." }, { status: 413 });
  try {
    const m = await saveImage(Buffer.from(await file.arrayBuffer()), file.name, alt);
    return NextResponse.json({ ok: true, media: m });
  } catch {
    return NextResponse.json({ ok: false, error: "Image illisible ou format non pris en charge (JPEG, PNG, WebP, AVIF, GIF)." }, { status: 422 });
  }
}

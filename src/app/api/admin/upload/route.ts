import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveImage, saveVideo, sniffVideo } from "@/lib/media";

export const runtime = "nodejs";
const MAX = 12 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

/** Upload d'image : validation du contenu réel, redimensionnement, conversion WebP, texte alternatif obligatoire. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  const alt = String(fd.get("alt") || "").trim();
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Aucun fichier." }, { status: 400 });
  if (!alt) return NextResponse.json({ ok: false, error: "Le texte alternatif est obligatoire (accessibilité et SEO)." }, { status: 422 });
  const buf = Buffer.from(await file.arrayBuffer());
  const isVideo = !!sniffVideo(buf);
  if (file.size > (isVideo ? MAX_VIDEO : MAX)) return NextResponse.json({ ok: false, error: isVideo ? "Vidéo trop lourde (80 Mo maximum)." : "Fichier trop lourd (12 Mo maximum)." }, { status: 413 });
  try {
    const m = isVideo ? await saveVideo(buf, file.name, alt) : await saveImage(buf, file.name, alt);
    return NextResponse.json({ ok: true, media: m });
  } catch {
    return NextResponse.json({ ok: false, error: "Fichier illisible ou format non pris en charge (images : JPEG, PNG, WebP, AVIF, GIF ; vidéos : MP4, WebM, MOV)." }, { status: 422 });
  }
}

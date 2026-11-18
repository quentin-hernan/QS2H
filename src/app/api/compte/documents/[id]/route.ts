import { NextResponse } from "next/server";
import path from "node:path";
import { getClient } from "@/lib/client-auth";
import { db } from "@/lib/db";
import { getPrivate } from "@/lib/storage";

export const runtime = "nodejs";

/** Téléchargement protégé : un client ne peut obtenir que ses propres documents (stockés hors du dossier public). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await getClient();
  if (!c) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const d = await db.clientDocument.findFirst({ where: { id: (await params).id, clientId: c.id } });
  if (!d) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  try {
    const buf = await getPrivate(d.file);
    const ext = d.mime === "application/pdf" ? ".pdf" : path.extname(d.file);
    return new NextResponse(new Uint8Array(buf), { headers: { "content-type": d.mime, "content-disposition": `attachment; filename="${d.title.replace(/[^\w\- ]+/g, "").trim() || "document"}${ext}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Fichier indisponible." }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const MAX = 15 * 1024 * 1024;
const TYPES: Record<string, string> = { "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg", "application/zip": ".zip" };

/** Dépôt d'un document pour un client (PDF, image ou ZIP). Stocké hors du dossier public, servi uniquement à son propriétaire. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  const clientId = String(fd.get("clientId") || "");
  const title = String(fd.get("title") || "").trim().slice(0, 160);
  const kind = String(fd.get("kind") || "autre");
  const projectId = String(fd.get("projectId") || "") || null;
  if (!(file instanceof File) || !title || !clientId) return NextResponse.json({ ok: false, error: "Fichier, titre et client requis." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "Fichier trop lourd (15 Mo)." }, { status: 413 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: "Formats acceptés : PDF, PNG, JPEG, ZIP." }, { status: 422 });
  if (!["devis", "facture", "livrable", "maquette", "autre"].includes(kind)) return NextResponse.json({ ok: false, error: "Type inconnu." }, { status: 422 });
  if (!(await db.client.findUnique({ where: { id: clientId }, select: { id: true } }))) return NextResponse.json({ ok: false, error: "Client inconnu." }, { status: 404 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf" && buf.subarray(0, 4).toString() !== "%PDF") return NextResponse.json({ ok: false, error: "PDF invalide." }, { status: 422 });
  const name = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "storage", "documents");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  const d = await db.clientDocument.create({ data: { clientId, projectId, kind, title, file: name, mime: file.type } });
  await db.auditLog.create({ data: { userEmail: s.email, action: "dépôt de document client", entity: "clientDocument", entityId: d.id } });
  return NextResponse.json({ ok: true, id: d.id });
}

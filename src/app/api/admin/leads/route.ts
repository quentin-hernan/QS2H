import { NextResponse } from "next/server";
import { getSession, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let t = String(v ?? "");
  if (/^[=+\-@]/.test(t)) t = "'" + t; // neutralise l'injection de formules tableur
  return `"${t.replace(/"/g, '""')}"`;
};

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  const head = ["Date", "Nom", "Email", "Téléphone", "Entreprise", "Projet", "Budget", "Délai", "Statut", "Message", "Notes"];
  const rows = leads.map((l) => [l.createdAt.toISOString(), l.name, l.email, l.phone, l.company, l.projectType, l.budget, l.deadline, l.status, l.message, l.notes].map(cell).join(";"));
  await audit(s.email, "export CSV des demandes", "lead");
  return new NextResponse("﻿" + [head.map(cell).join(";"), ...rows].join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="demandes-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}

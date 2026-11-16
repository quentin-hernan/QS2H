import { NextResponse } from "next/server";
import { getClient } from "@/lib/client-auth";
import { exportClient } from "@/lib/client-data";

export const runtime = "nodejs";

const csvCell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise l'injection de formules
  return `"${s.replace(/"/g, '""')}"`;
};

/** Droit d'accès et de portabilité : export de toutes les données du client connecté (JSON ou CSV). */
export async function GET(req: Request) {
  const c = await getClient();
  if (!c) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const data = await exportClient(c.id);
  if (!data) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const format = new URL(req.url).searchParams.get("format");
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const rows: string[] = ["section,index,champ,valeur"];
    for (const [section, val] of Object.entries(data)) {
      const items = Array.isArray(val) ? val : [val];
      items.forEach((it, i) => {
        if (it && typeof it === "object") for (const [k, v] of Object.entries(it)) rows.push([section, i, k, v].map(csvCell).join(","));
        else rows.push([section, i, "valeur", it].map(csvCell).join(","));
      });
    }
    return new NextResponse(rows.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="mes-donnees-qs2h-${stamp}.csv"`, "cache-control": "no-store" } });
  }
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="mes-donnees-qs2h-${stamp}.json"`, "cache-control": "no-store" } });
}

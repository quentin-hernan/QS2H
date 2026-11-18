"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { cleanStyle, isEmptyStyle, type StyleMap } from "@/lib/section-style";
import { parseJson } from "@/lib/utils";

type Result = { ok: boolean; error?: string };
const KEY = "sectionStyles";

async function load(): Promise<StyleMap> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  return parseJson<StyleMap>(row?.value, {});
}
async function persist(map: StyleMap, who: string, path: string) {
  await db.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: JSON.stringify(map) }, update: { value: JSON.stringify(map) } });
  await audit(who, "modification de l'apparence d'une page", "sectionStyles", path);
  revalidateTag("content");
  revalidatePath("/", "layout");
}
const validPath = (p: string) => /^\/[a-zA-Z0-9\-_/]*$/.test(p) && p.length <= 200;
const validIdx = (i: string) => /^\d{1,3}$/.test(i);

export async function saveSectionStyle(path: string, index: string, label: string, style: unknown): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path) || !validIdx(index)) return { ok: false, error: "Page ou section invalide." };
  const clean = cleanStyle(style);
  const map = await load();
  map[path] = map[path] ?? {};
  if (isEmptyStyle(clean)) delete map[path][index];
  else map[path][index] = { label: String(label).slice(0, 60), style: clean };
  if (!Object.keys(map[path]).length) delete map[path];
  await persist(map, s.email, path);
  return { ok: true };
}

export async function resetSectionStyle(path: string, index: string): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path) || !validIdx(index)) return { ok: false, error: "Page ou section invalide." };
  const map = await load();
  if (map[path]) { delete map[path][index]; if (!Object.keys(map[path]).length) delete map[path]; }
  await persist(map, s.email, path);
  return { ok: true };
}

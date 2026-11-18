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

/** Image d'un emplacement (photo d'équipe, pastille d'avis, visuel de formule…) choisie depuis l'éditeur d'apparence. */
export async function saveSlot(id: string, url: string): Promise<Result> {
  const s = await requireSession();
  if (!/^[a-zA-Z0-9\-_]{1,80}$/.test(id)) return { ok: false, error: "Emplacement invalide." };
  if (url && !/^(\/|https:\/\/)/.test(url)) return { ok: false, error: "Adresse d'image invalide." };
  const row = await db.setting.findUnique({ where: { key: "slots" } });
  const map = parseJson<Record<string, string>>(row?.value, {});
  if (url) map[id] = url.slice(0, 500); else delete map[id];
  await db.setting.upsert({ where: { key: "slots" }, create: { key: "slots", value: JSON.stringify(map) }, update: { value: JSON.stringify(map) } });
  await audit(s.email, "image d'un emplacement modifiée", "slots", id);
  revalidateTag("content");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------------ Textes et images modifiés directement sur la page */
type OvEntry = { o: string; v: string };
type PageOv = { t?: Record<string, OvEntry>; m?: Record<string, OvEntry> };
const OV_KEY = "overrides";
async function loadOv() { return parseJson<Record<string, PageOv>>((await db.setting.findUnique({ where: { key: OV_KEY } }))?.value, {}); }
async function persistOv(map: Record<string, PageOv>, who: string, path: string) {
  await db.setting.upsert({ where: { key: OV_KEY }, create: { key: OV_KEY, value: JSON.stringify(map) }, update: { value: JSON.stringify(map) } });
  await audit(who, "modification directe d'un texte ou d'une image", "overrides", path);
  revalidateTag("content");
  revalidatePath("/", "layout");
}

export async function saveOverride(path: string, kind: "t" | "m", index: number, orig: string, value: string): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path) || (kind !== "t" && kind !== "m") || !Number.isInteger(index) || index < 0 || index > 5000) return { ok: false, error: "Élément invalide." };
  const o = String(orig).slice(0, 2000), v = String(value).slice(0, 2000);
  if (kind === "t" && !/\p{L}/u.test(v)) return { ok: false, error: "Le texte ne peut pas être vide." };
  if (kind === "m" && v && !/^(\/|https:\/\/)/.test(v)) return { ok: false, error: "Adresse d'image invalide." };
  const map = await loadOv();
  const page = (map[path] = map[path] ?? {});
  const bucket = (page[kind] = page[kind] ?? {});
  if (!v || v === o) delete bucket[String(index)]; else bucket[String(index)] = { o, v };
  if (!Object.keys(bucket).length) delete page[kind];
  if (!page.t && !page.m) delete map[path];
  await persistOv(map, s.email, path);
  return { ok: true };
}

export async function resetOverrides(path: string): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path)) return { ok: false, error: "Page invalide." };
  const map = await loadOv();
  delete map[path];
  await persistOv(map, s.email, path);
  return { ok: true };
}

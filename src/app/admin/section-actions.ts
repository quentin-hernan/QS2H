"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { cleanStyle, isEmptyStyle, type StyleMap } from "@/lib/section-style";
import { parseJson } from "@/lib/utils";
import { cleanPageOverrides, isEmptyOv, type OverridesMap, type PageOverrides } from "@/lib/overrides";

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
  if (url && url !== "none" && !/^(\/|https:\/\/)/.test(url)) return { ok: false, error: "Adresse d'image invalide." };
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
const OV_KEY = "overrides";
async function loadOv() { return parseJson<OverridesMap>((await db.setting.findUnique({ where: { key: OV_KEY } }))?.value, {}); }
async function persistOv(map: OverridesMap, who: string, path: string) {
  await db.setting.upsert({ where: { key: OV_KEY }, create: { key: OV_KEY, value: JSON.stringify(map) }, update: { value: JSON.stringify(map) } });
  await audit(who, "modification directe des textes et images d'une page", "overrides", path);
  revalidateTag("content");
  revalidatePath("/", "layout");
}

/** Enregistre toutes les modifications directes d'une page (éditeur visuel ou admin : même donnée). */
export async function savePageOverrides(path: string, page: unknown): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path)) return { ok: false, error: "Page invalide." };
  const clean = cleanPageOverrides(page);
  const map = await loadOv();
  if (isEmptyOv(clean)) delete map[path]; else map[path] = clean;
  await persistOv(map, s.email, path);
  return { ok: true };
}

export async function getPageOverrides(path: string): Promise<PageOverrides> {
  await requireSession();
  return (await loadOv())[path] ?? {};
}

export async function resetOverrides(path: string): Promise<Result> {
  const s = await requireSession();
  if (!validPath(path)) return { ok: false, error: "Page invalide." };
  const map = await loadOv();
  delete map[path];
  await persistOv(map, s.email, path);
  return { ok: true };
}

/* ------------------------------------------------------------------ Équipe (page À propos) : même donnée que l'admin › Équipe */
const refreshAll = () => { revalidateTag("content"); revalidatePath("/", "layout"); };
export async function addTeamMember(): Promise<Result & { id?: string }> {
  const s = await requireSession();
  const last = await db.teamMember.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const m = await db.teamMember.create({ data: { name: "Prénom Nom", role: "Rôle dans l'équipe", bio: "Quelques lignes de présentation.", order: (last?.order ?? -1) + 1 } });
  await audit(s.email, "ajout d'un collaborateur", "teamMember", m.id);
  refreshAll();
  return { ok: true, id: m.id };
}
export async function updateTeamMember(id: string, d: { name: string; role: string; bio: string }): Promise<Result> {
  const s = await requireSession();
  const name = String(d.name).trim().slice(0, 120), role = String(d.role).trim().slice(0, 160), bio = String(d.bio).trim().slice(0, 2000);
  if (!name || !role) return { ok: false, error: "Le nom et le rôle sont requis." };
  await db.teamMember.update({ where: { id }, data: { name, role, bio } });
  await audit(s.email, "modification d'un collaborateur", "teamMember", id);
  refreshAll();
  return { ok: true };
}
export async function deleteTeamMember(id: string): Promise<Result> {
  const s = await requireSession();
  await db.teamMember.delete({ where: { id } });
  await audit(s.email, "suppression d'un collaborateur", "teamMember", id);
  refreshAll();
  return { ok: true };
}

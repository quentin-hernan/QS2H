"use server";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, clientIp, createSession, destroySession, hashPassword, checkNewPassword, mustSetup, requireSession, verifyPassword } from "@/lib/auth";
import { needsRehash } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { generateSecret, otpauthUri, verifyTotp } from "@/lib/totp";
import { LEAD_STATUSES, resourceByKey, type Resource } from "@/lib/admin-resources";
import { pageSchemas } from "@/lib/defaults";
import { cleanHtml } from "@/lib/sanitize";
import { esc, layout, sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/utils";
import { captureSite, captureViaWorker, storeCapture } from "@/lib/capture";
import { saveImage } from "@/lib/media";

type Result = { ok: boolean; error?: string; id?: string; fields?: Record<string, string[] | undefined> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (m: Resource["model"]) => (db as any)[m];
const refresh = () => { revalidateTag("content"); revalidatePath("/", "layout"); };

/* ---------------------------------------------------------------- Authentification */
let DUMMY: string | null = null; // hash factice : égalise le temps de réponse quand l'email est inconnu
export type LoginState = { error?: string; totp?: boolean } | undefined;

export async function loginAction(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const code = String(fd.get("code") || "");
  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return { error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} min.` };
  const fails = await db.loginLog.count({ where: { email, success: false, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
  if (fails >= 5) return { error: "Compte verrouillé quelques minutes après trop d'échecs. Réessayez dans 15 minutes." };

  const user = await db.user.findUnique({ where: { email } });
  DUMMY ??= await hashPassword("dummy-password-to-equalize-timing");
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY);
  const log = (success: boolean) => db.loginLog.create({ data: { email, ip, success } });
  if (!user || !ok) { await log(false); return { error: "Identifiants incorrects." }; }
  if (user.totpEnabled && user.totpSecret) {
    if (!code) return { totp: true };
    if (!verifyTotp(user.totpSecret, code)) { await log(false); return { totp: true, error: "Code de vérification invalide." }; }
  }
  await log(true);
  if (needsRehash(user.passwordHash)) await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  const must = mustSetup(user);
  await createSession({ uid: user.id, email: user.email, name: user.name, role: user.role as "owner" | "editor", must });
  await audit(user.email, "connexion", "session");
  redirect(must ? "/admin/compte" : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const s = await requireSession();
  const current = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  const confirm = String(fd.get("confirm") || "");
  const u = await db.user.findUnique({ where: { id: s.uid } });
  if (!u || !(await verifyPassword(current, u.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  const issue = await checkNewPassword(next);
  if (issue) return { error: issue };
  if (next !== confirm) return { error: "Les deux mots de passe ne correspondent pas." };
  const nu = await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(next), mustChangePassword: false } });
  await createSession({ ...s, must: mustSetup(nu) });
  await audit(s.email, "changement de mot de passe", "user", u.id);
  return { ok: true };
}

export async function start2fa() {
  const s = await requireSession();
  const secret = generateSecret();
  await db.user.update({ where: { id: s.uid }, data: { totpSecret: secret, totpEnabled: false } });
  return { secret, uri: otpauthUri(secret, s.email) };
}
export async function confirm2fa(code: string): Promise<Result> {
  const s = await requireSession();
  const u = await db.user.findUnique({ where: { id: s.uid } });
  if (!u?.totpSecret || !verifyTotp(u.totpSecret, code)) return { ok: false, error: "Code invalide. Vérifiez l'heure de votre téléphone." };
  const nu = await db.user.update({ where: { id: u.id }, data: { totpEnabled: true } });
  await createSession({ ...s, must: mustSetup(nu) });
  await audit(s.email, "activation 2FA", "user", u.id);
  return { ok: true };
}
export async function disable2fa(password: string): Promise<Result> {
  const s = await requireSession();
  const u = await db.user.findUnique({ where: { id: s.uid } });
  if (!u || !(await verifyPassword(password, u.passwordHash))) return { ok: false, error: "Mot de passe incorrect." };
  if (u.role === "owner" && process.env.ADMIN_REQUIRE_2FA === "true") return { ok: false, error: "La double authentification est obligatoire pour le propriétaire." };
  await db.user.update({ where: { id: u.id }, data: { totpEnabled: false, totpSecret: null } });
  await audit(s.email, "désactivation 2FA", "user", u.id);
  return { ok: true };
}

/* ---------------------------------------------------------------- Utilisateurs */
export async function inviteUser(_: { error?: string; ok?: string } | undefined, fd: FormData) {
  const s = await requireSession("owner");
  const parsed = z.object({ email: z.string().trim().toLowerCase().email("Email invalide."), name: z.string().trim().min(2, "Nom requis."), role: z.enum(["owner", "editor"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, name, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Un utilisateur avec cet email existe déjà." };
  const token = crypto.randomBytes(24).toString("hex");
  await db.user.create({ data: { email, name, role, passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")), inviteToken: token, inviteExpires: new Date(Date.now() + 7 * 864e5), mustChangePassword: false } });
  const link = `${SITE_URL}/admin/invitation/${token}`;
  await sendMail({ to: email, subject: "Invitation à l'administration QS2H", html: layout("Vous êtes invité(e)", `<p style="line-height:1.6">Bonjour ${esc(name)}, vous avez été invité(e) à gérer le site QS2H.</p><p><a href="${link}" style="display:inline-block;background:#2A5587;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none">Créer mon mot de passe</a></p><p style="font-size:13px;color:#5A5F66">Ce lien est valable 7 jours.</p>`) });
  await audit(s.email, "invitation utilisateur", "user", email);
  return { ok: `Invitation créée. Lien (si l'email n'est pas configuré) : ${link}` };
}
export async function acceptInvite(token: string, _: { error?: string } | undefined, fd: FormData) {
  const u = await db.user.findUnique({ where: { inviteToken: token } });
  if (!u || !u.inviteExpires || u.inviteExpires < new Date()) return { error: "Invitation invalide ou expirée." };
  const pwd = String(fd.get("password") || "");
  const issue = await checkNewPassword(pwd);
  if (issue) return { error: issue };
  if (pwd !== String(fd.get("confirm") || "")) return { error: "Les deux mots de passe ne correspondent pas." };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pwd), inviteToken: null, inviteExpires: null } });
  await audit(u.email, "invitation acceptée", "user", u.id);
  redirect("/admin/login");
}
export async function deleteUser(id: string) {
  const s = await requireSession("owner");
  if (id === s.uid) return;
  await db.user.delete({ where: { id } });
  await audit(s.email, "suppression utilisateur", "user", id);
  revalidatePath("/admin/utilisateurs");
}
export async function setUserRole(id: string, role: "owner" | "editor") {
  const s = await requireSession("owner");
  if (id === s.uid) return;
  await db.user.update({ where: { id }, data: { role } });
  await audit(s.email, "changement de rôle", "user", id);
  revalidatePath("/admin/utilisateurs");
}

/* ---------------------------------------------------------------- Ressources génériques */
function buildSchema(r: Resource, serviceSlugs: string[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of r.fields) {
    let s: z.ZodTypeAny;
    switch (f.type) {
      case "text":
      case "textarea": {
        let t = z.string().trim().max(f.max ?? 20000, `${f.label} : ${f.max ?? 20000} caractères maximum.`);
        if (f.required) t = t.min(1, `${f.label} est requis.`);
        s = t; break;
      }
      case "slug": s = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Adresse invalide : minuscules, chiffres et tirets uniquement."); break;
      case "number": s = f.name === "rating" ? z.coerce.number().int().min(1, "Note de 1 à 5.").max(5, "Note de 1 à 5.") : z.coerce.number().int().min(0).max(1_000_000); break;
      case "boolean": s = z.boolean(); break;
      case "select": s = z.enum((f.options as { value: string }[]).map((o) => o.value) as [string, ...string[]]); break;
      case "image": s = z.string().max(500); break;
      case "images": case "list": s = z.array(z.string().max(500)).max(100); break;
      case "multiselect": s = z.array(z.string().refine((v) => f.options !== "services" || serviceSlugs.includes(v), "Service inconnu.")); break;
      case "objlist": s = z.array(z.record(z.string().max(5000))).max(50); break;
      case "datetime": s = z.string().nullable().optional(); break;
      case "planes": s = z.array(z.object({ id: z.string().max(40), name: z.string().trim().min(1, "Chaque plan doit avoir un nom.").max(120), kind: z.enum(["nav", "hero", "section", "footer", "mobile", "tablet", "autre"]), image: z.string().max(500).min(1, "Chaque plan doit avoir une image."), caption: z.string().max(500), depth: z.number() })).max(16); break;
      case "meta": s = z.record(z.any()); break;
      case "richtext": { let t = z.string().max(300000); if (f.required) t = t.min(1, `${f.label} est requis.`); s = t; break; }
    }
    shape[f.name] = s;
  }
  return z.object(shape);
}

function toDb(r: Resource, data: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...data };
  for (const f of r.fields) {
    if (r.json.includes(f.name)) out[f.name] = data[f.name] ?? (f.type === "meta" ? {} : []);
    if (f.type === "richtext") out[f.name] = cleanHtml(String(data[f.name] ?? ""));
    if (f.type === "datetime") out[f.name] = data[f.name] ? new Date(String(data[f.name])) : null;
    if (f.type === "list") out[f.name] = (data[f.name] as string[]).map((x) => x.trim()).filter(Boolean);
    if (f.type === "objlist") out[f.name] = (data[f.name] as Record<string, string>[]).filter((o) => Object.values(o).some((v) => String(v).trim()));
    if (r.json.includes(f.name)) out[f.name] = JSON.stringify(out[f.name]);
  }
  if (r.model === "project") {
    if (out.status === "published" && !out.isExample && !out.authorized) throw new Error("NOT_AUTHORIZED");
    out.authorizedAt = out.authorized ? new Date() : null;
    if (out.year === 0) out.year = new Date().getFullYear();
  }
  if (r.model === "post" && out.status === "published" && !out.publishedAt) out.publishedAt = new Date();
  if (r.model === "redirect") {
    const to = String(out.to);
    if (!/^(\/|https?:\/\/)/.test(to)) throw new Error("INVALID_TO");
    if (!String(out.from).startsWith("/")) throw new Error("INVALID_FROM");
  }
  return out;
}

export async function saveResource(key: string, id: string, data: Record<string, unknown>): Promise<Result> {
  const s = await requireSession();
  const r = resourceByKey(key);
  if (!r) return { ok: false, error: "Ressource inconnue." };
  const services = await db.service.findMany({ select: { slug: true } });
  const parsed = buildSchema(r, services.map((x) => x.slug)).safeParse(data);
  if (!parsed.success) return { ok: false, error: "Certains champs sont invalides.", fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const payload = toDb(r, parsed.data);
    let rec: { id: string };
    if (id === "new") {
      if (r.orderable) { const last = await delegate(r.model).findFirst({ orderBy: { order: "desc" }, select: { order: true } }); payload.order = (last?.order ?? -1) + 1; }
      rec = await delegate(r.model).create({ data: payload });
    } else {
      rec = await delegate(r.model).update({ where: { id }, data: payload });
    }
    await audit(s.email, id === "new" ? "création" : "modification", r.key, rec.id);
    refresh();
    return { ok: true, id: rec.id };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.message === "NOT_AUTHORIZED") return { ok: false, error: "Un projet client ne peut être publié qu'avec l'autorisation du client : cochez la case d'autorisation, ou marquez-le « Projet concept »." , fields: { authorized: ["Autorisation requise pour publier."] } };
    if (err.code === "P2002") return { ok: false, error: "Cette adresse est déjà utilisée par un autre élément." };
    if (err.message === "INVALID_TO" || err.message === "INVALID_FROM") return { ok: false, error: "Les adresses doivent commencer par « / » (ou https:// pour la destination)." };
    console.error(e);
    return { ok: false, error: "Enregistrement impossible. Réessayez." };
  }
}

export async function deleteResource(key: string, id: string) {
  const s = await requireSession();
  const r = resourceByKey(key);
  if (!r) return;
  await delegate(r.model).delete({ where: { id } });
  await audit(s.email, "suppression", r.key, id);
  refresh();
  revalidatePath(`/admin/${key}`);
}

export async function moveResource(key: string, id: string, dir: -1 | 1) {
  await requireSession();
  const r = resourceByKey(key);
  if (!r || !r.orderable) return;
  const rows: { id: string; order: number }[] = await delegate(r.model).findMany({ orderBy: { order: "asc" }, select: { id: true, order: true } });
  const i = rows.findIndex((x) => x.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await Promise.all(rows.map((x, n) => delegate(r.model).update({ where: { id: x.id }, data: { order: n } })));
  refresh();
  revalidatePath(`/admin/${key}`);
}

export async function duplicateResource(key: string, id: string) {
  const s = await requireSession();
  const r = resourceByKey(key);
  if (!r) return;
  const src = await delegate(r.model).findUnique({ where: { id } });
  if (!src) return;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
  void _id; void _c; void _u;
  const copy: Record<string, unknown> = { ...rest };
  if (typeof copy[r.titleField] === "string") copy[r.titleField] = `${copy[r.titleField]} (copie)`;
  if ("slug" in copy) copy.slug = `${copy.slug}-copie-${Date.now().toString(36)}`;
  if (r.statusField) { if ("bool" in r.statusField) copy[r.statusField.name] = false; else copy[r.statusField.name] = r.statusField.draft; }
  if (r.orderable) { const last = await delegate(r.model).findFirst({ orderBy: { order: "desc" }, select: { order: true } }); copy.order = (last?.order ?? -1) + 1; }
  if (r.model === "project") { copy.isExample = false; copy.authorized = false; copy.authorizedAt = null; }
  const rec = await delegate(r.model).create({ data: copy });
  await audit(s.email, "duplication", r.key, rec.id);
  refresh();
  revalidatePath(`/admin/${key}`);
  redirect(`/admin/${key}/${rec.id}`);
}

/* ---------------------------------------------------------------- Pages et textes (avec historique) */
export async function savePage(key: string, data: Record<string, unknown>): Promise<Result> {
  const s = await requireSession();
  const schema = pageSchemas.find((p) => p.key === key);
  if (!schema) return { ok: false, error: "Page inconnue." };
  const body: Record<string, unknown> = {};
  for (const f of schema.fields) {
    const v = data[f.name];
    if (f.type === "list") body[f.name] = (Array.isArray(v) ? v : []).map((it) => Object.fromEntries((f.itemFields ?? []).map((i) => [i.name, String((it as Record<string, unknown>)?.[i.name] ?? "").slice(0, 5000)]))).filter((o) => Object.values(o).some((x) => x.trim()));
    else body[f.name] = String(v ?? "").slice(0, 20000);
  }
  const prev = await db.pageContent.findUnique({ where: { key } });
  if (prev) await db.pageVersion.create({ data: { key, body: prev.body, author: s.email } });
  await db.pageContent.upsert({ where: { key }, create: { key, body: JSON.stringify(body) }, update: { body: JSON.stringify(body) } });
  await audit(s.email, "modification de page", "page", key);
  refresh();
  return { ok: true };
}
export async function restorePageVersion(versionId: string): Promise<Result> {
  const s = await requireSession();
  const v = await db.pageVersion.findUnique({ where: { id: versionId } });
  if (!v) return { ok: false, error: "Version introuvable." };
  const cur = await db.pageContent.findUnique({ where: { key: v.key } });
  if (cur) await db.pageVersion.create({ data: { key: v.key, body: cur.body, author: s.email } });
  await db.pageContent.upsert({ where: { key: v.key }, create: { key: v.key, body: v.body }, update: { body: v.body } });
  await audit(s.email, "restauration de version", "page", v.key);
  refresh();
  revalidatePath(`/admin/pages/${v.key}`);
  return { ok: true };
}

/* ---------------------------------------------------------------- Paramètres */
const str = (n = 300) => z.string().trim().max(n);
const url = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\//.test(v), "Adresse https:// attendue.");
const settingSchemas: Record<string, z.ZodTypeAny> = {
  company: z.object({
    name: str(80).min(1), tagline: str(), legalName: str(), legalForm: str(), capital: str(), siren: str(), siret: str(), tva: str(),
    address: str(), zip: str(20), city: str(80).min(1), phone: str(40), email: z.string().trim().email("Email invalide."), hours: str(), area: str(500),
    director: str(), hostName: str(), hostAddress: str(500), mediator: str(500), dpoEmail: z.string().trim().email("Email DPO invalide."),
  }),
  theme: z.object({ accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue (#2A5587).") }),
  social: z.object({ linkedin: url, instagram: url, facebook: url }),
  integrations: z.object({ calendlyUrl: url, plausibleDomain: str(100), searchConsoleToken: str(200) }),
  booking: z.object({ mon: str(80), tue: str(80), wed: str(80), thu: str(80), fri: str(80), sat: str(80), sun: str(80), buffer: str(4), maxPerDay: str(4), noticeHours: str(4), horizonDays: str(4), closed: str(2000) }),
  footerText: str(500),
  trust: z.array(z.object({ value: str(30), label: str(120) })).max(6),
};
export async function saveSettings(section: string, data: unknown): Promise<Result> {
  const s = await requireSession("owner");
  const schema = settingSchemas[section];
  if (!schema) return { ok: false, error: "Section inconnue." };
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Valeurs invalides." };
  await db.setting.upsert({ where: { key: section }, create: { key: section, value: JSON.stringify(parsed.data) }, update: { value: JSON.stringify(parsed.data) } });
  await audit(s.email, "modification des paramètres", "setting", section);
  refresh();
  return { ok: true };
}

/* ---------------------------------------------------------------- Demandes (CRM léger) */
export async function updateLead(id: string, status: string, notes: string): Promise<Result> {
  const s = await requireSession();
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Statut invalide." };
  await db.lead.update({ where: { id }, data: { status, notes: notes.slice(0, 10000) } });
  await audit(s.email, "mise à jour demande", "lead", id);
  revalidatePath("/admin/demandes");
  return { ok: true };
}
export async function deleteLead(id: string) {
  const s = await requireSession();
  await db.lead.delete({ where: { id } });
  await audit(s.email, "suppression demande (RGPD)", "lead", id);
  revalidatePath("/admin/demandes");
  redirect("/admin/demandes");
}

/* ---------------------------------------------------------------- Médiathèque */
export async function updateMediaAlt(id: string, alt: string): Promise<Result> {
  await requireSession();
  if (!alt.trim()) return { ok: false, error: "Le texte alternatif est obligatoire." };
  await db.media.update({ where: { id }, data: { alt: alt.trim().slice(0, 300) } });
  revalidatePath("/admin/mediatheque");
  return { ok: true };
}
export async function deleteMedia(id: string) {
  const s = await requireSession();
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return;
  if (m.url.startsWith("/uploads/")) await fs.unlink(path.join(process.cwd(), "public", m.url)).catch(() => {});
  await db.media.delete({ where: { id } });
  await audit(s.email, "suppression média", "media", id);
  revalidatePath("/admin/mediatheque");
}

/* ---------------------------------------------------------------- Capture de réalisations */
export async function captureProject(url: string, title: string) {
  const s = await requireSession();
  const rl = rateLimit(`capture:${s.uid}`, 6, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false as const, error: "Trop de captures cette heure. Réessayez plus tard." };
  try {
    const { assertPublicUrl } = await import("@/lib/ssrf");
    await assertPublicUrl(url);
    const raw = process.env.CAPTURE_WORKER_URL ? await captureViaWorker(url) : await captureSite(url);
    const out = await storeCapture(raw, title || "projet");
    await audit(s.email, "capture de site", "project", url);
    return { ok: true as const, planes: out.planes, meta: out.meta, cover: out.cover };
  } catch (e) {
    const m = (e as Error).message || "";
    const known = /URL|adresse|Adresse|port|domaine|Redirection|répondu|refusé|identifiants/.test(m);
    console.error("capture", m);
    return { ok: false as const, error: known ? m : "Capture impossible (navigateur indisponible ou site inaccessible). Ajoutez les images à la main ou configurez CAPTURE_WORKER_URL." };
  }
}

/** Import d'images : chaque fichier devient un plan (le type est choisi ensuite dans l'éditeur). */
export async function importPlaneImages(fd: FormData) {
  await requireSession();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File);
  const title = String(fd.get("title") || "projet");
  const planes: { id: string; name: string; kind: "section"; image: string; caption: string; depth: number }[] = [];
  for (const [i, f] of files.slice(0, 12).entries()) {
    if (f.size > 12 * 1024 * 1024) return { ok: false as const, error: `${f.name} dépasse 12 Mo.` };
    try {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const m = await saveImage(Buffer.from(await f.arrayBuffer()), f.name, `${name} — ${title}`);
      planes.push({ id: `i${Date.now().toString(36)}${i}`, name, kind: "section", image: m.url, caption: "", depth: i });
    } catch { return { ok: false as const, error: `${f.name} : image illisible (formats JPEG, PNG, WebP, AVIF, GIF).` }; }
  }
  return { ok: true as const, planes };
}

/* ---------------------------------------------------------------- Textes légaux versionnés */
export async function saveLegal(doc: string, html: string, major: boolean, note: string): Promise<Result & { version?: number; notified?: number }> {
  const s = await requireSession("owner");
  const { LEGAL_DOCS, latestLegal } = await import("@/lib/legal-db");
  if (!(doc in LEGAL_DOCS)) return { ok: false, error: "Document inconnu." };
  const clean = cleanHtml(html);
  if (clean.replace(/<[^>]+>/g, "").trim().length < 50) return { ok: false, error: "Le texte est trop court." };
  const last = await latestLegal(doc as keyof typeof LEGAL_DOCS);
  const version = (last?.version ?? 1) + 1; // 1 = modèle généré, la première version enregistrée porte le n° 2
  await db.legalVersion.create({ data: { doc, version, html: clean, major, note: note.slice(0, 300), author: s.email } });
  let notified = 0;
  if (major && ["cgu", "confidentialite", "cgv"].includes(doc)) {
    const clients = await db.client.findMany({ where: { emailVerifiedAt: { not: null } }, select: { email: true, firstName: true } });
    const info = LEGAL_DOCS[doc as keyof typeof LEGAL_DOCS];
    for (const c of clients) {
      await sendMail({ to: c.email, subject: `Mise à jour : ${info.title}`, html: layout("Nos conditions évoluent", `<p style="line-height:1.6">Bonjour ${esc(c.firstName)},</p><p style="line-height:1.6">Le document « ${esc(info.title)} » a été mis à jour (version ${version}). Vous pouvez le consulter ici : <a href="${SITE_URL}${info.path}">${SITE_URL}${info.path}</a>. L'ancienne version reste consultable depuis la même page.</p>`) });
      notified++;
    }
  }
  await audit(s.email, `texte légal ${doc} v${version}${major ? " (majeur)" : ""}`, "legal", doc);
  revalidatePath("/", "layout");
  return { ok: true, version, notified };
}

/* ---------------------------------------------------------------- Clients (espace client) */
export async function saveClientProject(clientId: string, projectId: string | null, title: string, steps: { name: string; status: string; note: string }[]): Promise<Result> {
  const s = await requireSession();
  const t = title.trim();
  if (!t) return { ok: false, error: "Titre requis." };
  const clean = steps.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim().slice(0, 120), status: ["a-venir", "en-cours", "termine"].includes(x.status) ? x.status : "a-venir", note: (x.note || "").slice(0, 300) }));
  if (projectId) await db.clientProject.update({ where: { id: projectId }, data: { title: t, steps: JSON.stringify(clean) } });
  else await db.clientProject.create({ data: { clientId, title: t, steps: JSON.stringify(clean) } });
  await audit(s.email, projectId ? "modification suivi projet" : "création suivi projet", "client", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}
export async function deleteClientProject(clientId: string, projectId: string) {
  const s = await requireSession();
  await db.clientProject.delete({ where: { id: projectId } });
  await audit(s.email, "suppression suivi projet", "client", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
}
export async function replyToClient(clientId: string, body: string): Promise<Result> {
  const s = await requireSession();
  const b = body.trim();
  if (!b) return { ok: false, error: "Message vide." };
  const c = await db.client.findUnique({ where: { id: clientId } });
  if (!c) return { ok: false, error: "Client introuvable." };
  await db.clientMessage.create({ data: { clientId, body: b.slice(0, 4000), fromClient: false } });
  await sendMail({ to: c.email, subject: "Nouveau message de QS2H", html: layout("Vous avez un nouveau message", `<p style="line-height:1.6">Bonjour ${esc(c.firstName)}, QS2H vous a écrit dans votre espace client.</p><p><a href="${SITE_URL}/compte/messages" style="display:inline-block;background:#2A5587;color:#fff;padding:12px 22px;text-decoration:none">Lire le message</a></p>`) });
  await audit(s.email, "réponse client", "client", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}
export async function deleteClientAdmin(clientId: string): Promise<Result> {
  const s = await requireSession("owner");
  const { eraseClient } = await import("@/lib/client-data");
  await eraseClient(clientId);
  await audit(s.email, "suppression compte client (RGPD)", "client", clientId);
  revalidatePath("/admin/clients");
  return { ok: true };
}
export async function deleteClientDocument(clientId: string, docId: string) {
  const s = await requireSession();
  const d = await db.clientDocument.findUnique({ where: { id: docId } });
  if (!d) return;
  await db.clientDocument.delete({ where: { id: docId } });
  await fs.rm(path.join(process.cwd(), "storage", "documents", d.file), { force: true });
  await audit(s.email, "suppression document client", "client", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
}

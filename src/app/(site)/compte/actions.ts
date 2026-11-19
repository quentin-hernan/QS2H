"use server";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/shop";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkNewPassword, hashPassword, needsRehash, sha256, token, verifyPassword } from "@/lib/password";
import { createClientSession, destroyClientSession, rawIp, requireClient, truncatedIp, userAgent } from "@/lib/client-auth";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { legalVersionNumber } from "@/lib/legal-db";
import { SITE_URL } from "@/lib/utils";
import { eraseClient } from "@/lib/client-data";
import { notifyAdmin } from "@/lib/notify";

export type S = { error?: string; ok?: string } | undefined;
const btn = (href: string, label: string) => `<p><a href="${href}" style="display:inline-block;background:#2A5587;color:#fff;padding:12px 22px;text-decoration:none">${esc(label)}</a></p><p style="font-size:13px;color:#5F5F5F;word-break:break-all">${esc(href)}</p>`;
const GENERIC_LOGIN = "Identifiants incorrects.";

/* ------------------------------------------------------------------ Inscription */
const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis.").max(80),
  lastName: z.string().trim().min(1, "Nom requis.").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide.").max(200),
  company: z.string().trim().max(120).optional(),
  password: z.string(),
  cgu: z.literal("on", { errorMap: () => ({ message: "Vous devez accepter les CGU et la politique de confidentialité." }) }),
  majorite: z.literal("on", { errorMap: () => ({ message: "Vous devez déclarer être majeur(e) et utiliser le service à titre professionnel." }) }),
  newsletter: z.string().optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function registerAction(_: S, fd: FormData): Promise<S> {
  const ip = await rawIp();
  if (!rateLimit(`reg:${ip}`, 5, 60 * 60 * 1000).ok) return { error: "Trop de tentatives. Réessayez dans une heure." };
  const p = registerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const pw = await checkNewPassword(d.password);
  if (pw) return { error: pw };
  if (d.password !== String(fd.get("confirm") || "")) return { error: "Les deux mots de passe ne correspondent pas." };

  const generic: S = { ok: "Compte créé. Un email de vérification vient de vous être envoyé : cliquez sur le lien pour activer votre compte (valable 24 h)." };
  const existing = await db.client.findUnique({ where: { email: d.email } });
  if (existing) {
    // Ne révèle pas l'existence du compte : même réponse, et l'email invite à se connecter.
    await sendMail({ to: d.email, subject: "Votre compte QS2H", html: layout("Vous avez déjà un compte", `<p style="line-height:1.6">Quelqu'un (peut-être vous) a tenté de créer un compte avec cette adresse. Vous en avez déjà un :</p>${btn(`${SITE_URL}/compte/connexion`, "Me connecter")}<p style="font-size:13px">Mot de passe oublié ? ${SITE_URL}/compte/mot-de-passe-oublie</p>`) });
    return generic;
  }
  const t = token();
  const tip = await truncatedIp();
  const [cguV, privV] = await Promise.all([legalVersionNumber("cgu"), legalVersionNumber("confidentialite")]);
  const client = await db.client.create({
    data: {
      email: d.email, firstName: d.firstName, lastName: d.lastName, company: d.company ?? "",
      passwordHash: await hashPassword(d.password), verifyTokenHash: sha256(t), verifyExpires: new Date(Date.now() + 24 * 3600e3),
      consents: { create: [
        { kind: "cgu", docVersion: cguV, ipTruncated: tip },
        { kind: "confidentialite", docVersion: privV, ipTruncated: tip },
        { kind: "majorite", docVersion: 0, ipTruncated: tip },
      ] },
    },
  });
  await sendMail({ to: d.email, subject: "Confirmez votre adresse email", html: layout("Activez votre compte", `<p style="line-height:1.6">Bonjour ${esc(d.firstName)}, confirmez votre adresse pour activer votre espace client QS2H.</p>${btn(`${SITE_URL}/compte/verification/${t}`, "Vérifier mon adresse")}`) });
  if (d.newsletter === "on") await sendNewsletterConfirmation(client.id, d.email, d.firstName);
  await notifyAdmin({ kind: "compte", title: `Nouveau compte client : ${d.firstName} ${d.lastName}`, body: d.company || d.email, link: `/admin/clients/${client.id}` });
  // accès immédiat à l'espace client : l'adresse email sera confirmée plus tard (rappel affiché dans l'espace)
  await createClientSession(client.id, client.sessionVersion);
  redirect(safeNext(fd.get("next")) || "/compte");
}

/** Renvoie le lien de confirmation de l'adresse email (depuis l'espace client). */
export async function resendVerification(): Promise<{ ok?: string; error?: string }> {
  const c = await requireClient();
  if (c.emailVerifiedAt) return { ok: "Votre adresse est déjà confirmée." };
  if (!rateLimit(`verif:${c.id}`, 3, 60 * 60 * 1000).ok) return { error: "Trop de demandes. Réessayez plus tard." };
  const t = token();
  await db.client.update({ where: { id: c.id }, data: { verifyTokenHash: sha256(t), verifyExpires: new Date(Date.now() + 24 * 3600e3) } });
  await sendMail({ to: c.email, subject: "Confirmez votre adresse email", html: layout("Confirmez votre adresse", `<p style="line-height:1.6">Bonjour ${esc(c.firstName)}, confirmez votre adresse email pour sécuriser votre espace client QS2H.</p>${btn(`${SITE_URL}/compte/verification/${t}`, "Confirmer mon adresse")}`) });
  return { ok: "Email envoyé : vérifiez votre boîte de réception." };
}

async function sendNewsletterConfirmation(clientId: string, email: string, firstName: string) {
  const t = token();
  await db.client.update({ where: { id: clientId }, data: { newsletterTokenHash: sha256(t) } });
  const c = await db.client.findUnique({ where: { id: clientId }, select: { unsubToken: true } });
  await sendMail({ to: email, subject: "Confirmez votre inscription aux actualités QS2H", html: layout("Une dernière étape", `<p style="line-height:1.6">Bonjour ${esc(firstName)}, vous avez demandé à recevoir nos actualités. Confirmez votre choix (double consentement) :</p>${btn(`${SITE_URL}/newsletter/confirmer/${t}`, "Confirmer mon inscription")}<p style="font-size:12px;color:#5F5F5F">Désinscription en un clic à tout moment : ${SITE_URL}/newsletter/desinscription/${c?.unsubToken}</p>`) });
}

/* ------------------------------------------------------------------ Connexion */
export async function loginClient(_: S, fd: FormData): Promise<S> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const ip = await rawIp();
  if (!rateLimit(`clogin:${ip}`, 10, 15 * 60 * 1000).ok) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  const fails = await db.clientLogin.count({ where: { email, success: false, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
  if (fails >= 5) return { error: "Trop d'échecs : compte temporairement verrouillé. Réessayez dans 15 minutes." };
  const c = await db.client.findUnique({ where: { email } });
  const dummy = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$Jl3UvNn0uV2oG2rQmM3o8XJm3VQp0g2m0b0x0v6x0jM";
  const ok = await verifyPassword(password, c?.passwordHash ?? dummy);
  const log = (success: boolean) => db.clientLogin.create({ data: { clientId: c?.id ?? null, email, ipTruncated: "", agent: "", success } }).catch(() => null);
  if (!c || !ok) { await log(false); return { error: GENERIC_LOGIN }; }
  await db.clientLogin.create({ data: { clientId: c.id, email, ipTruncated: await truncatedIp(), agent: await userAgent(), success: true } });
  await db.client.update({ where: { id: c.id }, data: { lastLoginAt: new Date(), inactivityWarnedAt: null, ...(needsRehash(c.passwordHash) ? { passwordHash: await hashPassword(password) } : {}) } });
  await createClientSession(c.id, c.sessionVersion);
  redirect(safeNext(fd.get("next")) || "/compte");
}

export async function logoutClient() {
  await destroyClientSession();
  redirect("/");
}
export async function logoutEverywhere() {
  const c = await requireClient();
  await db.client.update({ where: { id: c.id }, data: { sessionVersion: { increment: 1 } } });
  await destroyClientSession();
  redirect("/compte/connexion");
}

/* ------------------------------------------------------------------ Vérification email, réinitialisation */
export async function verifyEmail(t: string) {
  const c = await db.client.findUnique({ where: { verifyTokenHash: sha256(t) } });
  if (!c || !c.verifyExpires || c.verifyExpires < new Date()) return false;
  await db.client.update({ where: { id: c.id }, data: { emailVerifiedAt: new Date(), verifyTokenHash: null, verifyExpires: null } });
  return true;
}

export async function forgotPassword(_: S, fd: FormData): Promise<S> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!rateLimit(`forgot:${await rawIp()}`, 5, 60 * 60 * 1000).ok) return { error: "Trop de demandes. Réessayez plus tard." };
  const c = await db.client.findUnique({ where: { email } });
  if (c) {
    const t = token();
    await db.client.update({ where: { id: c.id }, data: { resetTokenHash: sha256(t), resetExpires: new Date(Date.now() + 3600e3) } });
    await sendMail({ to: email, subject: "Réinitialisation de votre mot de passe", html: layout("Nouveau mot de passe", `<p style="line-height:1.6">Pour choisir un nouveau mot de passe, utilisez ce lien. Il est valable 1 heure et ne fonctionne qu'une fois.</p>${btn(`${SITE_URL}/compte/reinitialisation/${t}`, "Choisir un mot de passe")}<p style="font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`) });
  }
  return { ok: "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé." };
}

export async function resetPassword(t: string, _: S, fd: FormData): Promise<S> {
  const c = await db.client.findUnique({ where: { resetTokenHash: sha256(t) } });
  if (!c || !c.resetExpires || c.resetExpires < new Date()) return { error: "Ce lien est invalide ou expiré. Refaites une demande." };
  const pw = String(fd.get("password") || "");
  const issue = await checkNewPassword(pw);
  if (issue) return { error: issue };
  if (pw !== String(fd.get("confirm") || "")) return { error: "Les deux mots de passe ne correspondent pas." };
  await db.client.update({ where: { id: c.id }, data: { passwordHash: await hashPassword(pw), resetTokenHash: null, resetExpires: null, sessionVersion: { increment: 1 }, emailVerifiedAt: c.emailVerifiedAt ?? new Date() } });
  redirect("/compte/connexion?reset=1");
}

/* ------------------------------------------------------------------ Profil, mot de passe, newsletter */
export async function updateProfile(_: S, fd: FormData): Promise<S> {
  const c = await requireClient();
  const p = z.object({ firstName: z.string().trim().min(1, "Prénom requis.").max(80), lastName: z.string().trim().min(1, "Nom requis.").max(80), company: z.string().trim().max(120), phone: z.string().trim().max(30).regex(/^[0-9+().s-]*$/, "Numéro de téléphone invalide.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  await db.client.update({ where: { id: c.id }, data: p.data });
  revalidatePath("/compte", "layout");
  return { ok: "Informations enregistrées." };
}

export async function changeClientPassword(_: S, fd: FormData): Promise<S> {
  const c = await requireClient();
  if (!(await verifyPassword(String(fd.get("current") || ""), c.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  const next = String(fd.get("next") || "");
  const issue = await checkNewPassword(next);
  if (issue) return { error: issue };
  if (next !== String(fd.get("confirm") || "")) return { error: "Les deux mots de passe ne correspondent pas." };
  const u = await db.client.update({ where: { id: c.id }, data: { passwordHash: await hashPassword(next), sessionVersion: { increment: 1 } } });
  await createClientSession(u.id, u.sessionVersion);
  return { ok: "Mot de passe modifié. Vos autres sessions ont été déconnectées." };
}

export async function setNewsletter(on: boolean): Promise<S> {
  const c = await requireClient();
  if (!on) {
    await db.client.update({ where: { id: c.id }, data: { newsletter: false, newsletterTokenHash: null } });
    await db.consent.updateMany({ where: { clientId: c.id, kind: "newsletter", withdrawnAt: null }, data: { withdrawnAt: new Date() } });
    revalidatePath("/compte/donnees");
    return { ok: "Vous êtes désinscrit(e) des actualités." };
  }
  await sendNewsletterConfirmation(c.id, c.email, c.firstName);
  return { ok: "Un email de confirmation vient de vous être envoyé : cliquez sur le lien pour valider votre inscription." };
}

export async function confirmNewsletter(t: string) {
  const c = await db.client.findUnique({ where: { newsletterTokenHash: sha256(t) } });
  if (!c) return false;
  await db.client.update({ where: { id: c.id }, data: { newsletter: true, newsletterTokenHash: null } });
  await db.consent.create({ data: { clientId: c.id, kind: "newsletter", docVersion: await legalVersionNumber("confidentialite"), ipTruncated: await truncatedIp() } });
  return true;
}
export async function unsubscribeNewsletter(unsubToken: string) {
  const c = await db.client.findUnique({ where: { unsubToken } });
  if (!c) return false;
  await db.client.update({ where: { id: c.id }, data: { newsletter: false, newsletterTokenHash: null } });
  await db.consent.updateMany({ where: { clientId: c.id, kind: "newsletter", withdrawnAt: null }, data: { withdrawnAt: new Date() } });
  return true;
}

/* ------------------------------------------------------------------ Messages, maquettes */
export async function sendClientMessage(_: S, fd: FormData): Promise<S> {
  const c = await requireClient();
  const body = String(fd.get("body") || "").trim();
  if (body.length < 2) return { error: "Écrivez votre message." };
  if (body.length > 4000) return { error: "Message trop long (4 000 caractères)." };
  if (!rateLimit(`msg:${c.id}`, 20, 3600e3).ok) return { error: "Trop de messages. Réessayez plus tard." };
  await db.clientMessage.create({ data: { clientId: c.id, body, fromClient: true } });
  await notifyAdmin({ kind: "message", title: `Message de ${c.firstName} ${c.lastName}`, body: body.slice(0, 140), link: `/admin/clients/${c.id}` });
  const to = process.env.MAIL_TO || "contact@qs2h.fr";
  await sendMail({ to, subject: `Message de ${c.firstName} ${c.lastName}`, html: layout("Nouveau message client", `<p style="line-height:1.6;white-space:pre-wrap">${esc(body)}</p><p style="font-size:13px">${SITE_URL}/admin/clients/${c.id}</p>`), replyTo: c.email });
  revalidatePath("/compte/messages");
  return { ok: "Message envoyé." };
}

export async function reviewMockup(docId: string, status: "validée" | "modifications demandées") {
  const c = await requireClient();
  const d = await db.clientDocument.findFirst({ where: { id: docId, clientId: c.id, kind: "maquette" } });
  if (!d) return;
  await db.clientDocument.update({ where: { id: d.id }, data: { status } });
  await db.clientMessage.create({ data: { clientId: c.id, body: `Maquette « ${d.title} » : ${status}.`, fromClient: true } });
  revalidatePath("/compte/documents");
}

/* ------------------------------------------------------------------ Droit à l'effacement */
export async function requestDeletion(): Promise<S> {
  const c = await requireClient();
  const t = token();
  await db.client.update({ where: { id: c.id }, data: { deleteTokenHash: sha256(t), deleteExpires: new Date(Date.now() + 3600e3) } });
  await sendMail({ to: c.email, subject: "Confirmez la suppression de votre compte", html: layout("Suppression de compte", `<p style="line-height:1.6">Vous avez demandé la suppression de votre compte QS2H. Cette action est définitive. Seules les factures sont conservées 10 ans, comme la loi l'exige. Lien valable 1 heure :</p>${btn(`${SITE_URL}/compte/suppression/${t}`, "Confirmer la suppression")}<p style="font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`) });
  return { ok: "Un email de confirmation vient de vous être envoyé. La suppression est effective après clic sur le lien." };
}

export async function confirmDeletion(t: string) {
  const c = await db.client.findUnique({ where: { deleteTokenHash: sha256(t) } });
  if (!c || !c.deleteExpires || c.deleteExpires < new Date()) return false;
  await eraseClient(c.id);
  await destroyClientSession();
  return true;
}

/* ------------------------------------------------------------------ Demandes de modification */
export async function createClientRequest(_: S, fd: FormData): Promise<S> {
  const c = await requireClient();
  const title = String(fd.get("title") || "").trim();
  const details = String(fd.get("details") || "").trim();
  const priority = ["basse", "normale", "urgente"].includes(String(fd.get("priority"))) ? String(fd.get("priority")) : "normale";
  const projectId = String(fd.get("projectId") || "") || null;
  if (title.length < 3 || title.length > 120) return { error: "Donnez un titre court à votre demande (3 à 120 caractères)." };
  if (details.length < 10 || details.length > 4000) return { error: "Décrivez la modification (10 à 4 000 caractères)." };
  if (projectId && !(await db.clientProject.findFirst({ where: { id: projectId, clientId: c.id } }))) return { error: "Projet inconnu." };
  if (!rateLimit(`req:${c.id}`, 10, 3600e3).ok) return { error: "Trop de demandes. Réessayez plus tard." };
  await db.clientRequest.create({ data: { clientId: c.id, projectId, title, details, priority } });
  await notifyAdmin({ kind: "demande", title: `Demande de modification : ${title}`, body: `${c.firstName} ${c.lastName} · priorité ${priority}`, link: `/admin/clients/${c.id}` });
  const to = process.env.MAIL_TO || "contact@qs2h.fr";
  await sendMail({ to, subject: `Demande de modification (${priority}) — ${c.firstName} ${c.lastName}`, html: layout("Nouvelle demande de modification", `<p><strong>${esc(title)}</strong></p><p style="line-height:1.6;white-space:pre-wrap">${esc(details)}</p><p style="font-size:13px">${SITE_URL}/admin/clients/${c.id}</p>`), replyTo: c.email });
  revalidatePath("/compte/demandes");
  revalidatePath("/compte");
  return { ok: "Demande envoyée. Vous suivrez son avancement ici." };
}

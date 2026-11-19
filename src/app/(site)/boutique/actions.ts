"use server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { esc, layout, sendMail } from "@/lib/email";
import { getSettings } from "@/lib/content";
import { money, type OrderLine } from "@/lib/shop";
import { SITE_URL } from "@/lib/utils";
import { legalVersionNumber } from "@/lib/legal-db";
import { getClient } from "@/lib/client-auth";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120).regex(/^[\p{L}][\p{L}\s'’.-]*$/u, "Le nom ne peut contenir que des lettres."),
  email: z.string().trim().toLowerCase().email("Email invalide.").max(200),
  phone: z.string().trim().max(40).optional().default("").refine((v) => !v || (/^\+?[0-9 .()-]{6,20}$/.test(v) && v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15), "Numéro de téléphone invalide (chiffres uniquement, ex. 06 12 34 56 78)."),
  company: z.string().trim().max(120).optional().default(""),
  delivery: z.enum(["livraison", "retrait"]),
  address: z.string().trim().max(200).optional().default(""),
  zip: z.string().trim().max(12).optional().default(""),
  city: z.string().trim().max(80).optional().default("").refine((v) => !v || /^[\p{L}][\p{L}\s'’.-]*$/u.test(v), "Nom de ville invalide."),
  note: z.string().trim().max(2000).optional().default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Merci d'accepter l'utilisation de vos informations pour traiter la commande." }) }),
  cgv: z.literal(true, { errorMap: () => ({ message: "Merci d'accepter les conditions générales de vente de la boutique." }) }),
  website: z.string().max(0).optional(), // pot de miel
  lines: z.array(z.object({ slug: z.string().max(120), qty: z.number().int().min(1).max(20) })).min(1, "Votre panier est vide.").max(40),
});
export type OrderInput = z.input<typeof schema>;
export type OrderResult = { ok: true; number: string } | { ok: false; error: string; fields?: Record<string, string> };

/** Commande sans paiement en ligne : les prix et le stock sont revérifiés ici, jamais repris du navigateur. */
export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  // un compte client est obligatoire : la commande est rattachée au compte et suivie dans l'espace client
  const client = await getClient();
  if (!client) return { ok: false, error: "Connectez-vous ou créez un compte pour passer commande." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
  // les formulaires incomplets ne comptent pas dans la limite : seules les vraies commandes sont limitées
  const p = schema.safeParse(input);
  if (!p.success) {
    const fields: Record<string, string> = {};
    for (const i of p.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Certains champs sont à corriger.", fields };
  }
  const d = { ...p.data, email: client.email };
  if (d.website) return { ok: true, number: "—" };
  if (d.delivery === "livraison") {
    const fields: Record<string, string> = {};
    if (d.address.length < 5 || !/\p{L}{3,}/u.test(d.address) || !/^[\p{L}0-9\s,.'’°#/-]+$/u.test(d.address)) fields.address = "Indiquez une adresse valide (numéro et nom de rue).";
    if (!/^\d{5}$/.test(d.zip)) fields.zip = "Code postal à 5 chiffres.";
    if (d.city.length < 2) fields.city = "Indiquez votre ville.";
    if (Object.keys(fields).length) return { ok: false, error: "Indiquez l'adresse de livraison complète.", fields };
  }
  if (!rateLimit(`order:${ip}`, 8, 60 * 60 * 1000).ok) return { ok: false, error: "Trop de commandes en peu de temps. Réessayez plus tard ou écrivez-nous." };

  const items = await db.shopItem.findMany({ where: { published: true, slug: { in: d.lines.map((l) => l.slug) } } });
  const lines: OrderLine[] = [];
  for (const l of d.lines) {
    const it = items.find((x) => x.slug === l.slug);
    if (!it) return { ok: false, error: "Un article de votre panier n'est plus disponible. Retirez-le puis réessayez." };
    if (it.stock === 0) return { ok: false, error: `« ${it.title} » est en rupture de stock.` };
    if (it.stock > 0 && l.qty > it.stock) return { ok: false, error: `Il ne reste que ${it.stock} « ${it.title} » en stock.` };
    lines.push({ slug: it.slug, title: it.title, price: it.price, qty: l.qty });
  }
  const total = Math.round(lines.reduce((a, l) => a + l.price * l.qty, 0) * 100) / 100;
  const now = new Date();
  const cgvVersion = await legalVersionNumber("vente");
  const number = `QS-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await db.$transaction([
    db.shopOrder.create({ data: { number, name: d.name, email: d.email, phone: d.phone, company: d.company, delivery: d.delivery, address: d.address, zip: d.zip, city: d.city, note: d.note, items: JSON.stringify(lines), total, cgvVersion, clientId: client.id, history: JSON.stringify([{ status: "nouvelle", at: now.toISOString() }]) } }),
    ...lines.map((l) => {
      const it = items.find((x) => x.slug === l.slug)!;
      return it.stock > 0 ? db.shopItem.update({ where: { id: it.id }, data: { stock: { decrement: l.qty } } }) : db.shopItem.findUnique({ where: { id: it.id } });
    }),
  ]);
  revalidateTag("content");

  const s = await getSettings();
  const table = `<table style="width:100%;border-collapse:collapse">${lines.map((l) => `<tr><td style="padding:6px 0">${esc(l.title)} × ${l.qty}</td><td style="text-align:right">${money(l.price * l.qty)}</td></tr>`).join("")}<tr><td style="padding-top:10px;font-weight:bold">Total TTC</td><td style="text-align:right;font-weight:bold">${money(total)}</td></tr></table>`;
  const where = d.delivery === "retrait" ? "Retrait sur place" : `${esc(d.address)}, ${esc(d.zip)} ${esc(d.city)}`;
  await Promise.allSettled([
    sendMail({ to: process.env.MAIL_TO || s.company.email, replyTo: d.email, subject: `Nouvelle commande ${number} — ${money(total)}`, html: layout(`Commande ${number}`, `<p><strong>${esc(d.name)}</strong>${d.company ? ` (${esc(d.company)})` : ""}<br>${esc(d.email)} ${esc(d.phone)}</p><p>${where}</p>${table}${d.note ? `<p style="white-space:pre-wrap">${esc(d.note)}</p>` : ""}<p style="font-size:13px">${SITE_URL}/admin/commandes</p>`) }),
    sendMail({ to: d.email, subject: `Votre commande ${number} chez QS2H`, html: layout("Merci pour votre commande", `<p style="line-height:1.6">Bonjour ${esc(d.name)},</p><p style="line-height:1.6">Nous avons bien reçu votre commande <strong>${number}</strong>. Vous pouvez la suivre à tout moment dans votre espace client : ${SITE_URL}/compte/commandes. Nous la vérifions et revenons vers vous rapidement avec la confirmation et la facture. Aucun paiement n'a été demandé à ce stade.</p>${table}<p style="line-height:1.6">${where}</p><p style="line-height:1.6">L'équipe QS2H</p>`) }),
  ]);
  return { ok: true, number };
}

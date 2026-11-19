"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { esc, layout, sendMail } from "@/lib/email";
import { parseJson, SITE_URL } from "@/lib/utils";
import { ORDER_STATUSES, clientSteps, type OrderHistory, type OrderLine } from "@/lib/shop";
import { notifyClient } from "@/lib/notify";

type Result = { ok: boolean; error?: string; message?: string };

/** Remet en stock (annulation) ou re-décompte (réactivation) les articles à stock suivi. Stock -1 = sur commande : jamais touché. */
async function adjustStock(items: OrderLine[], sign: 1 | -1) {
  for (const l of items) {
    const it = await db.shopItem.findUnique({ where: { slug: l.slug } });
    if (!it || it.stock < 0) continue;
    const next = Math.max(0, it.stock + sign * l.qty);
    await db.shopItem.update({ where: { id: it.id }, data: { stock: next } });
  }
}

const SUBJECT: Record<string, string> = {
  confirmée: "est confirmée",
  préparation: "est en préparation",
  expédiée: "a été expédiée",
  terminée: "est terminée",
  annulée: "a été annulée",
};

/**
 * Met à jour une commande : statut, transporteur, numéro de suivi, note interne.
 * Chaque changement de statut est horodaté (visible dans l'espace client) et prévient le client par email.
 */
export async function updateOrder(id: string, input: { status: string; carrier?: string; tracking?: string; adminNote?: string; notify?: boolean }): Promise<Result> {
  const s = await requireSession();
  if (!(ORDER_STATUSES as readonly string[]).includes(input.status)) return { ok: false, error: "Statut inconnu." };
  const o = await db.shopOrder.findUnique({ where: { id } });
  if (!o) return { ok: false, error: "Commande introuvable." };
  const carrier = String(input.carrier ?? "").trim().slice(0, 80);
  const tracking = String(input.tracking ?? "").trim().slice(0, 80);
  const adminNote = String(input.adminNote ?? "").trim().slice(0, 4000);
  const changed = input.status !== o.status;
  const history = parseJson<OrderHistory>(o.history, []);
  if (changed) history.push({ status: input.status, at: new Date().toISOString() });
  if (!history.length) history.push({ status: o.status, at: o.createdAt.toISOString() });

  await db.shopOrder.update({ where: { id }, data: { status: input.status, carrier, tracking, adminNote, history: JSON.stringify(history) } });
  const items = parseJson<OrderLine[]>(o.items, []);
  if (changed && input.status === "annulée") await adjustStock(items, 1);
  if (changed && o.status === "annulée") await adjustStock(items, -1);
  await audit(s.email, `commande ${o.number} : ${input.status}`, "shopOrder", id);
  revalidatePath("/admin/commandes");
  revalidatePath("/compte/commandes");
  revalidateTag("content");

  let message = "Commande mise à jour.";
  if (changed) await notifyClient(o.clientId, { kind: "commande", title: `Commande ${o.number} : ${(clientSteps(o.delivery).find((x) => x.key === input.status)?.label ?? input.status).toLowerCase()}`, body: input.status === "expédiée" && tracking ? `Suivi : ${carrier} ${tracking}`.trim() : "", link: "/compte/commandes" });
  if (changed && input.notify !== false && SUBJECT[input.status]) {
    const step = clientSteps(o.delivery).find((x) => x.key === input.status)?.label ?? input.status;
    const track = input.status === "expédiée" && (carrier || tracking) ? `<p style="line-height:1.6">Transporteur : <strong>${esc(carrier || "—")}</strong>${tracking ? ` · Suivi : <strong>${esc(tracking)}</strong>` : ""}</p>` : "";
    const ok = await sendMail({
      to: o.email,
      subject: `Votre commande ${o.number} ${SUBJECT[input.status]}`,
      html: layout("Mise à jour de votre commande", `<p style="line-height:1.6">Bonjour ${esc(o.name)},</p><p style="line-height:1.6">Votre commande <strong>${esc(o.number)}</strong> ${SUBJECT[input.status]} (étape : ${esc(step)}).</p>${track}<p><a href="${SITE_URL}/compte/commandes" style="display:inline-block;background:#2A5587;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none">Suivre ma commande</a></p>`),
    });
    message = ok ? "Commande mise à jour, le client a été prévenu par email." : "Commande mise à jour (l'email au client n'a pas pu partir : vérifiez la configuration des emails).";
  }
  return { ok: true, message };
}

export async function deleteOrder(id: string): Promise<Result> {
  const s = await requireSession("owner");
  const o = await db.shopOrder.findUnique({ where: { id } });
  if (!o) return { ok: false, error: "Commande introuvable." };
  await db.shopOrder.delete({ where: { id } });
  await audit(s.email, `suppression commande ${o.number}`, "shopOrder", id);
  revalidatePath("/admin/commandes");
  revalidatePath("/compte/commandes");
  return { ok: true };
}

"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/shop";

/** Statut d'une commande boutique (nouvelle, confirmée, expédiée, terminée, annulée). */
export async function setOrderStatus(id: string, status: string) {
  const s = await requireSession();
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;
  await db.shopOrder.update({ where: { id }, data: { status } });
  await audit(s.email, `commande : ${status}`, "shopOrder", id);
  revalidatePath("/admin/commandes");
}

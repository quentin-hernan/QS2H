import "server-only";
import { db } from "./db";

export type NoticeKind = "message" | "panier" | "rdv" | "devis" | "commande" | "demande" | "compte" | "statut" | "document";
type N = { kind: NoticeKind; title: string; body?: string; link?: string };
const clip = (n: N) => ({ kind: n.kind, title: n.title.slice(0, 160), body: (n.body ?? "").slice(0, 400), link: (n.link ?? "").slice(0, 300) });

/** Notification pour l'administration (cloche + bulle animée). Ne bloque jamais l'action qui la déclenche. */
export async function notifyAdmin(n: N) {
  await db.notice.create({ data: { audience: "admin", ...clip(n) } }).catch((e) => console.error("[notice]", e));
}

/** Notification pour un client, dans son espace (cloche + bulle animée). */
export async function notifyClient(clientId: string | null | undefined, n: N) {
  if (!clientId) return;
  await db.notice.create({ data: { audience: "client", clientId, ...clip(n) } }).catch((e) => console.error("[notice]", e));
}

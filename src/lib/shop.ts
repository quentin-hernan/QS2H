/** Boutique : formats et règles partagés (serveur et navigateur). */
export const money = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export type StockState = { label: string; tone: "ok" | "low" | "out" | "order" };
export function stockState(stock: number): StockState {
  if (stock < 0) return { label: "Sur commande", tone: "order" };
  if (stock === 0) return { label: "Rupture de stock", tone: "out" };
  if (stock <= 3) return { label: `Plus que ${stock} en stock`, tone: "low" };
  return { label: "En stock", tone: "ok" };
}
export const canBuy = (stock: number) => stock !== 0;
export const maxQty = (stock: number) => (stock < 0 ? 20 : Math.min(20, stock));
export const discount = (price: number, compare: number) => (compare > price && price > 0 ? Math.round((1 - price / compare) * 100) : 0);

/** Article tel que le panier le conserve (le prix est revérifié côté serveur à la commande). */
export type CartLine = { slug: string; title: string; price: number; image: string; qty: number; stock: number };
export type OrderLine = { slug: string; title: string; price: number; qty: number };
export const ORDER_STATUSES = ["nouvelle", "confirmée", "préparation", "expédiée", "terminée", "annulée"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
/** Étiquettes côté administration. */
export const ADMIN_STATUS: Record<string, string> = { nouvelle: "À traiter", confirmée: "Confirmée", préparation: "En préparation", expédiée: "Expédiée", terminée: "Terminée", annulée: "Annulée" };
/** Étapes du suivi affiché au client (comme sur une marketplace). Le retrait remplace « expédiée » par « prête à retirer ». */
export const clientSteps = (delivery: string) => [
  { key: "nouvelle", label: "Commande reçue" },
  { key: "confirmée", label: "Confirmée" },
  { key: "préparation", label: "En préparation" },
  { key: "expédiée", label: delivery === "retrait" ? "Prête à retirer" : "Expédiée" },
  { key: "terminée", label: delivery === "retrait" ? "Retirée" : "Livrée" },
];
export const stepIndex = (status: string) => ORDER_STATUSES.indexOf(status as OrderStatus); // nouvelle=0 … terminée=4, annulée=5
export type OrderHistory = { status: string; at: string }[];
/** Redirection après connexion : uniquement un chemin interne du site. */
export const safeNext = (n: unknown) => (typeof n === "string" && /^\/(?!\/)[a-zA-Z0-9\-_/?=&%.]*$/.test(n) && n.length < 200 ? n : "");

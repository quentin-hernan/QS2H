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
export const ORDER_STATUSES = ["nouvelle", "confirmée", "expédiée", "terminée", "annulée"] as const;

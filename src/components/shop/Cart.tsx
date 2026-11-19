"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { maxQty, money, type CartLine } from "@/lib/shop";

type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "qs2h-cart";

/** Panier : conservé dans le navigateur du visiteur (aucun compte nécessaire). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]); // le panier se referme quand on change de page (ex. « Commander » vers la connexion)
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(v)) setLines(v.filter((x) => x && typeof x.slug === "string")); } catch { /* stockage indisponible */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* navigation privée */ } }, [lines, loaded]);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  const add = useCallback((l: Omit<CartLine, "qty">, qty = 1) => {
    setLines((p) => {
      const cur = p.find((x) => x.slug === l.slug);
      const q = Math.min(maxQty(l.stock), (cur?.qty ?? 0) + qty);
      return cur ? p.map((x) => (x.slug === l.slug ? { ...x, ...l, qty: q } : x)) : [...p, { ...l, qty: Math.max(1, q) }];
    });
    setOpen(true);
    // client connecté : l'administration est prévenue (sans effet pour un visiteur sans compte)
    fetch("/api/compte/cart-event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: l.title, qty }), keepalive: true }).catch(() => {});
  }, []);
  const setQty = useCallback((slug: string, qty: number) => setLines((p) => p.map((x) => (x.slug === slug ? { ...x, qty: Math.max(1, Math.min(maxQty(x.stock), qty)) } : x))), []);
  const remove = useCallback((slug: string) => setLines((p) => p.filter((x) => x.slug !== slug)), []);
  const clear = useCallback(() => setLines([]), []);
  const value = useMemo(() => ({ lines, open, setOpen, add, setQty, remove, clear, count: lines.reduce((a, l) => a + l.qty, 0), total: lines.reduce((a, l) => a + l.qty * l.price, 0) }), [lines, open, add, setQty, remove, clear]);
  return <CartCtx.Provider value={value}>{children}<CartDrawer /></CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("CartProvider manquant");
  return c;
}

/** Icône panier de l'en-tête, avec le nombre d'articles. */
export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} className="cart-btn" aria-label={`Panier : ${count} article${count > 1 ? "s" : ""}`}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 7V6a3 3 0 0 1 6 0v1" /></svg>
      {count > 0 && <span className="cart-count" aria-hidden="true">{count}</span>}
    </button>
  );
}

/** Bouton « Ajouter au panier » (avec quantité facultative). */
export function AddToCart({ item, qty = 1, className = "", label = "Ajouter au panier" }: { item: Omit<CartLine, "qty">; qty?: number; className?: string; label?: string }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  if (item.stock === 0) return <button type="button" disabled className={`btn btn-ghost ${className}`}>Indisponible</button>;
  return (
    <button type="button" className={`btn btn-primary btn-fill ${className}`} onClick={() => { add(item, qty); setDone(true); setTimeout(() => setDone(false), 1600); }}>
      <span>{done ? "Ajouté ✓" : label}</span>
    </button>
  );
}

export function QtyInput({ value, onChange, max, label = "Quantité" }: { value: number; onChange: (n: number) => void; max: number; label?: string }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Diminuer" disabled={value <= 1}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Augmenter" disabled={value >= max}>+</button>
    </div>
  );
}

function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total, count } = useCart();
  return (
    <div className="site-shell">
    <div className={`cart-layer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button type="button" className="cart-scrim" aria-label="Fermer le panier" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside className="cart-drawer light-section" role="dialog" aria-modal="true" aria-label="Panier">
        <header className="flex items-center justify-between border-b hair px-6 py-5">
          <p className="text-lg font-semibold">Panier {count > 0 && <span className="muted font-normal">({count})</span>}</p>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-sm hover:bg-black/5" tabIndex={open ? 0 : -1}>Fermer ✕</button>
        </header>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="muted">Votre panier est vide.</p>
            <Link href="/boutique" onClick={() => setOpen(false)} className="btn btn-primary" tabIndex={open ? 0 : -1}>Voir la boutique</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {lines.map((l) => (
                <li key={l.slug} className="flex gap-4">
                  <Link href={`/boutique/${l.slug}`} onClick={() => setOpen(false)} className="shop-thumb h-20 w-20 flex-none" tabIndex={open ? 0 : -1}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <span className="shop-ph">{l.title.slice(0, 1)}</span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="muted text-sm">{money(l.price)}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <QtyInput value={l.qty} max={l.stock < 0 ? 20 : Math.min(20, l.stock)} onChange={(n) => setQty(l.slug, n)} />
                      <button type="button" className="muted text-sm underline" onClick={() => remove(l.slug)} tabIndex={open ? 0 : -1}>Retirer</button>
                    </div>
                  </div>
                  <p className="font-medium">{money(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
            <footer className="border-t hair px-6 py-5">
              <div className="flex items-baseline justify-between"><span className="muted">Total TTC</span><span className="text-2xl font-semibold">{money(total)}</span></div>
              <p className="muted mt-1 text-[0.8rem]">Aucun paiement en ligne : nous confirmons votre commande et vous envoyons la facture.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/boutique/commande" onClick={() => setOpen(false)} className="btn btn-primary btn-fill w-full" tabIndex={open ? 0 : -1}><span>Commander</span></Link>
                <Link href="/boutique/panier" onClick={() => setOpen(false)} className="btn btn-ghost w-full" tabIndex={open ? 0 : -1}>Voir le panier</Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
    </div>
  );
}

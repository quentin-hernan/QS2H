"use client";
import Link from "next/link";
import { money } from "@/lib/shop";
import { QtyInput, useCart } from "./Cart";

/** Page panier : récapitulatif modifiable. */
export function CartPage() {
  const { lines, setQty, remove, total } = useCart();
  if (!lines.length) return (
    <div className="py-16 text-center"><p className="muted">Votre panier est vide.</p><Link href="/boutique" className="btn btn-primary mt-6">Voir la boutique</Link></div>
  );
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <ul className="divide-y hair border-y hair lg:col-span-8">
        {lines.map((l) => (
          <li key={l.slug} className="flex flex-wrap items-center gap-5 py-5">
            <Link href={`/boutique/${l.slug}`} className="shop-thumb h-24 w-24 flex-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <span className="shop-ph">{l.title.slice(0, 1)}</span>}
            </Link>
            <div className="min-w-0 flex-1"><Link href={`/boutique/${l.slug}`} className="font-medium hover:underline">{l.title}</Link><p className="muted text-sm">{money(l.price)} l&apos;unité</p></div>
            <QtyInput value={l.qty} max={l.stock < 0 ? 20 : Math.min(20, l.stock)} onChange={(n) => setQty(l.slug, n)} />
            <p className="w-24 text-right font-semibold">{money(l.price * l.qty)}</p>
            <button type="button" className="muted text-sm underline" onClick={() => remove(l.slug)}>Retirer</button>
          </li>
        ))}
      </ul>
      <aside className="shop-summary lg:col-span-4">
        <div className="flex items-baseline justify-between"><span className="muted">Total TTC</span><span className="text-2xl font-semibold">{money(total)}</span></div>
        <p className="muted mt-2 text-[0.85rem]">Livraison ou retrait chiffrés à la confirmation. Aucun paiement en ligne.</p>
        <Link href="/boutique/commande" className="btn btn-primary btn-fill mt-5 w-full"><span>Commander</span></Link>
        <Link href="/boutique" className="btn btn-ghost mt-2 w-full">Continuer mes achats</Link>
      </aside>
    </div>
  );
}

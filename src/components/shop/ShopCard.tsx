"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Gallery, ProductBuy } from "./ProductBuy";
import { discount, money, stockState } from "@/lib/shop";
import { useCart } from "./Cart";

export type ShopCardItem = { slug: string; title: string; tagline: string; category: string; brand: string; price: number; comparePrice: number; stock: number; badge: string; image: string; images: string[]; isExample: boolean; featured: boolean; order: number; features?: string[]; description?: string };

/** Carte article : grande image sur fond doux, seconde image au survol, ajout rapide au panier. */
export function ShopCard({ p, priority = false }: { p: ShopCardItem; priority?: boolean }) {
  const { add } = useCart();
  const off = discount(p.price, p.comparePrice);
  const st = stockState(p.stock);
  const alt = p.images[0];
  const [qv, setQv] = useState(false);
  return (
    <article className="shop-card group">
      <div className="relative">
      <Link href={`/boutique/${p.slug}`} className="shop-media" aria-label={p.title} data-cursor="Voir">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={p.image} alt="" loading={priority ? "eager" : "lazy"} className="shop-img" /> : <span className="shop-ph" aria-hidden="true">{p.title.slice(0, 1)}</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image && alt && <img src={alt} alt="" loading="lazy" className="shop-img shop-img-alt" />}
        <span className="shop-badges">
          {off > 0 && <span className="shop-badge is-sale">−{off} %</span>}
          {p.badge && <span className="shop-badge">{p.badge}</span>}
          {p.isExample && <span className="shop-badge is-ghost">Exemple</span>}
        </span>
      </Link>
      <button type="button" className="shop-peek" onClick={() => setQv(true)} aria-label={`Aperçu rapide : ${p.title}`} title="Aperçu rapide">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
        <span>Aperçu</span>
      </button>
      {p.stock !== 0 && (
        <button type="button" className="shop-quick" onClick={() => add({ slug: p.slug, title: p.title, price: p.price, image: p.image, stock: p.stock })} aria-label={`Ajouter ${p.title} au panier`}>
          <span aria-hidden="true">+</span> Ajouter
        </button>
      )}
      </div>
      {qv && <QuickView p={p} onClose={() => setQv(false)} />}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {(p.brand || p.category) && <p className="muted text-[0.78rem] uppercase tracking-[0.12em]">{p.brand || p.category}</p>}
          <h3 className="shop-name mt-1 text-[1.05rem] leading-snug"><Link href={`/boutique/${p.slug}`} className="hover:underline underline-offset-4">{p.title}</Link></h3>
          <p className={`mt-1 text-[0.8rem] stock-${st.tone}`}>{st.label}</p>
        </div>
        <p className="text-right">
          <span className="block font-semibold">{money(p.price)}</span>
          {off > 0 && <s className="muted block text-[0.85rem]">{money(p.comparePrice)}</s>}
        </p>
      </div>
    </article>
  );
}

/** Aperçu rapide : fenêtre avec images, prix, disponibilité, points forts et ajout au panier, sans quitter la liste. */
function QuickView({ p, onClose }: { p: ShopCardItem; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const off = discount(p.price, p.comparePrice);
  const st = stockState(p.stock);
  const imgs = [p.image, ...p.images].filter(Boolean);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.documentElement.classList.add("lenis-stopped");
    return () => document.documentElement.classList.remove("lenis-stopped");
  }, []);
  return (
    <dialog ref={ref} className="shop-qv light-section" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current?.close()} aria-label={`Aperçu : ${p.title}`}>
      <button type="button" className="shop-qv-close" onClick={() => ref.current?.close()} aria-label="Fermer l'aperçu">✕</button>
      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={imgs} title={p.title} />
        <div className="flex flex-col">
          {(p.brand || p.category) && <p className="muted text-[0.78rem] uppercase tracking-[0.14em]">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>}
          <h2 className="mt-2 text-h3 font-medium">{p.title}</h2>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-[1.6rem] font-semibold">{money(p.price)}</span>
            {off > 0 && <><s className="muted">{money(p.comparePrice)}</s><span className="shop-badge is-sale !static">−{off} %</span></>}
            <span className="muted text-sm">TTC</span>
          </div>
          <p className={`mt-1 text-sm stock-${st.tone}`}>● {st.label}</p>
          {p.tagline && <p className="muted mt-4 leading-relaxed">{p.tagline}</p>}
          {p.features && p.features.length > 0 && <ul className="mt-4 space-y-1.5 text-[0.95rem]">{p.features.slice(0, 4).map((f) => (<li key={f} className="flex gap-3"><span className="acc" aria-hidden="true">—</span>{f}</li>))}</ul>}
          <div className="mt-6"><ProductBuy slug={p.slug} title={p.title} price={p.price} image={p.image || imgs[0] || ""} stock={p.stock} /></div>
          <Link href={`/boutique/${p.slug}`} className="xp-link mt-6 self-start">Voir la fiche complète <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </dialog>
  );
}

/** Grille de la boutique : filtres par catégorie, tri, recherche. */
export function ShopGrid({ items }: { items: ShopCardItem[] }) {
  const cats = useMemo(() => Array.from(new Set(items.map((p) => p.category).filter(Boolean))), [items]);
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState<"order" | "asc" | "desc" | "new">("order");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const l = items.filter((p) => (!cat || p.category === cat) && (!n || `${p.title} ${p.brand} ${p.tagline} ${p.category}`.toLowerCase().includes(n)));
    if (sort === "asc") return [...l].sort((a, b) => a.price - b.price);
    if (sort === "desc") return [...l].sort((a, b) => b.price - a.price);
    if (sort === "new") return [...l].reverse();
    return l;
  }, [items, cat, sort, q]);
  return (
    <div>
      <div className="shop-toolbar">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Catégories">
          <button type="button" aria-pressed={!cat} className="shop-chip" onClick={() => setCat("")}>Tout <span className="muted">{items.length}</span></button>
          {cats.map((c) => (<button key={c} type="button" aria-pressed={cat === c} className="shop-chip" onClick={() => setCat(c)}>{c} <span className="muted">{items.filter((p) => p.category === c).length}</span></button>))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="shop-q">Rechercher</label>
          <input id="shop-q" type="search" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="shop-search" />
          <label className="sr-only" htmlFor="shop-sort">Trier</label>
          <select id="shop-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="shop-search !w-auto">
            <option value="order">Sélection QS2H</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
            <option value="new">Nouveautés</option>
          </select>
        </div>
      </div>
      {list.length === 0 ? <p className="muted py-16 text-center">Aucun article ne correspond.</p> : (
        <ul className="shop-grid">{list.map((p, i) => <li key={p.slug}><ShopCard p={p} priority={i < 4} /></li>)}</ul>
      )}
    </div>
  );
}

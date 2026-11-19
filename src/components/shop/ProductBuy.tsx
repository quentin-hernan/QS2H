"use client";
import { useState } from "react";
import { maxQty } from "@/lib/shop";
import { AddToCart, QtyInput } from "./Cart";

/** Galerie de la fiche article : grande image + vignettes. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="shop-media shop-gal"><span className="shop-ph text-[6rem]" aria-hidden="true">{title.slice(0, 1)}</span></div>;
  return (
    <div>
      <div className="shop-media shop-gal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={images[i]} src={images[i]} alt={`${title}, vue ${i + 1}`} className="shop-img swap" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3" role="group" aria-label="Autres vues">
          {images.map((src, n) => (
            <button key={src + n} type="button" onClick={() => setI(n)} aria-pressed={i === n} aria-label={`Vue ${n + 1}`} className={`shop-thumb aspect-square ${i === n ? "is-on" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Quantité + ajout au panier. */
export function ProductBuy({ slug, title, price, image, stock }: { slug: string; title: string; price: number; image: string; stock: number }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {stock !== 0 && <QtyInput value={qty} onChange={setQty} max={maxQty(stock)} />}
      <AddToCart item={{ slug, title, price, image, stock }} qty={qty} className="flex-1 sm:flex-none" />
    </div>
  );
}

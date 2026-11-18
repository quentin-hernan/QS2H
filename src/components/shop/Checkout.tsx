"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { money } from "@/lib/shop";
import { placeOrder } from "@/app/(site)/boutique/actions";
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

const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div><label className="label" htmlFor={id}>{label}</label>{children}{error && <p className="err" role="alert">{error}</p>}</div>
);

/** Formulaire de commande : coordonnées, livraison ou retrait, récapitulatif. */
export function CheckoutForm() {
  const { lines, total, clear } = useCart();
  const router = useRouter();
  const [delivery, setDelivery] = useState<"livraison" | "retrait">("livraison");
  const [err, setErr] = useState<{ error?: string; fields?: Record<string, string> }>({});
  const [pending, start] = useTransition();
  if (!lines.length) return <div className="py-16 text-center"><p className="muted">Votre panier est vide.</p><Link href="/boutique" className="btn btn-primary mt-6">Voir la boutique</Link></div>;
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) || "");
    start(async () => {
      const r = await placeOrder({ name: v("name"), email: v("email"), phone: v("phone"), company: v("company"), delivery, address: v("address"), zip: v("zip"), city: v("city"), note: v("note"), consent: fd.get("consent") === "on", cgv: fd.get("cgv") === "on", website: v("website"), lines: lines.map((l) => ({ slug: l.slug, qty: l.qty })) } as never);
      if (!r.ok) { setErr({ error: r.error, fields: r.fields }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      clear();
      router.push(`/boutique/merci?n=${encodeURIComponent(r.number)}`);
    });
  };
  const fe = err.fields ?? {};
  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        {err.error && <p role="alert" className="err rounded-xl border p-4">{err.error}</p>}
        <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="mb-4 text-h3 font-medium">Vos coordonnées</legend>
          <F id="name" label="Nom et prénom *" error={fe.name}><input id="name" name="name" autoComplete="name" className="field" required /></F>
          <F id="email" label="Email *" error={fe.email}><input id="email" name="email" type="email" autoComplete="email" className="field" required /></F>
          <F id="phone" label="Téléphone"><input id="phone" name="phone" type="tel" autoComplete="tel" className="field" /></F>
          <F id="company" label="Entreprise"><input id="company" name="company" autoComplete="organization" className="field" /></F>
        </fieldset>
        <fieldset><legend className="mb-4 text-h3 font-medium">Réception</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["livraison", "retrait"] as const).map((k) => (
              <label key={k} className={`shop-option ${delivery === k ? "is-on" : ""}`}>
                <input type="radio" name="delivery" value={k} checked={delivery === k} onChange={() => setDelivery(k)} className="sr-only" />
                <strong>{k === "livraison" ? "Livraison" : "Retrait à La Rochelle"}</strong>
                <span className="muted text-sm">{k === "livraison" ? "Frais confirmés avec la facture." : "Gratuit, sur rendez-vous."}</span>
              </label>
            ))}
          </div>
          {delivery === "livraison" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-6">
              <div className="sm:col-span-6"><F id="address" label="Adresse *" error={fe.address}><input id="address" name="address" autoComplete="street-address" className="field" /></F></div>
              <div className="sm:col-span-2"><F id="zip" label="Code postal *"><input id="zip" name="zip" autoComplete="postal-code" className="field" /></F></div>
              <div className="sm:col-span-4"><F id="city" label="Ville *"><input id="city" name="city" autoComplete="address-level2" className="field" /></F></div>
            </div>
          )}
        </fieldset>
        <F id="note" label="Une précision ? (facultatif)"><textarea id="note" name="note" rows={4} className="field" /></F>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="flex items-start gap-3 text-[0.9rem] leading-snug"><input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0" /><span className="muted">J&apos;accepte que QS2H utilise ces informations pour traiter ma commande (voir la <Link className="link-u acc" href="/politique-de-confidentialite">politique de confidentialité</Link>).</span></label>
        {fe.consent && <p className="err" role="alert">{fe.consent}</p>}
        <label className="flex items-start gap-3 text-[0.9rem] leading-snug"><input type="checkbox" name="cgv" className="mt-1 h-5 w-5 shrink-0" /><span className="muted">J&apos;ai lu et j&apos;accepte les <Link className="link-u acc" href="/cgv-boutique" target="_blank" rel="noopener">conditions générales de vente de la boutique</Link>, dont le droit de rétractation de 14 jours pour les particuliers.</span></label>
        {fe.cgv && <p className="err" role="alert">{fe.cgv}</p>}
      </div>
      <aside className="lg:col-span-5">
        <div className="shop-summary lg:sticky lg:top-28">
          <p className="mb-4 font-semibold">Récapitulatif</p>
          <ul className="space-y-3">{lines.map((l) => (<li key={l.slug} className="flex justify-between gap-4 text-[0.95rem]"><span>{l.title} <span className="muted">× {l.qty}</span></span><span>{money(l.price * l.qty)}</span></li>))}</ul>
          <div className="mt-5 flex items-baseline justify-between border-t hair pt-4"><span className="muted">Total TTC</span><span className="text-2xl font-semibold">{money(total)}</span></div>
          <button className="btn btn-primary btn-fill mt-5 w-full" disabled={pending}><span>{pending ? "Envoi…" : "Valider la commande"}</span></button>
          <p className="muted mt-3 text-[0.8rem]">Aucun paiement maintenant : nous vous confirmons la commande et vous envoyons la facture.</p>
        </div>
      </aside>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { money } from "@/lib/shop";
import { placeOrder } from "@/app/(site)/boutique/actions";
import { useCart } from "./Cart";

const F = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div><label className="label" htmlFor={id}>{label}</label>{children}{error && <p className="err" id={`${id}-err`} role="alert">{error}</p>}</div>
);

type Vals = { name: string; email: string; phone: string; company: string; address: string; zip: string; city: string; note: string };
type Sug = { label: string; street: string; zip: string; city: string };

const validate = (v: Vals, delivery: "livraison" | "retrait", consent: boolean, cgv: boolean) => {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = "Indiquez votre nom et prénom.";
  else if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(v.name.trim())) e.name = "Le nom ne peut contenir que des lettres (pas de chiffres).";
  if (!v.email.trim()) e.email = "Indiquez votre email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Adresse email invalide.";
  const digits = v.phone.replace(/\D/g, "");
  if (v.phone.trim() && (digits.length < 8 || digits.length > 15)) e.phone = "Numéro de téléphone invalide (ex. 06 12 34 56 78).";
  if (delivery === "livraison") {
    const a = v.address.trim();
    if (a.length < 5 || !/\p{L}{3,}/u.test(a)) e.address = "Indiquez une adresse valide (numéro et nom de rue).";
    else if (!/^[\p{L}0-9\s,.'’°#/-]+$/u.test(a)) e.address = "L'adresse contient des caractères non autorisés.";
    if (!/^\d{5}$/.test(v.zip)) e.zip = v.zip ? "Code postal à 5 chiffres." : "Indiquez votre code postal.";
    if (v.city.trim().length < 2) e.city = "Indiquez votre ville.";
  }
  if (!consent) e.consent = "Merci d'accepter l'utilisation de vos informations pour traiter la commande.";
  if (!cgv) e.cgv = "Merci d'accepter les conditions générales de vente.";
  return e;
};

/**
 * Formulaire de commande : coordonnées, livraison ou retrait, récapitulatif.
 * Champs obligatoires contrôlés dans le navigateur (puis revérifiés côté serveur), saisies filtrées (code postal et téléphone : chiffres),
 * villes proposées d'après le code postal (geo.api.gouv.fr) et adresses suggérées (api-adresse.data.gouv.fr).
 */
export function CheckoutForm({ account }: { account: { name: string; email: string; company: string } }) {
  const { lines, total, clear } = useCart();
  const router = useRouter();
  const [delivery, setDelivery] = useState<"livraison" | "retrait">("livraison");
  const [v, setV] = useState<Vals>({ name: account.name, email: account.email, phone: "", company: account.company, address: "", zip: "", city: "", note: "" });
  const [consent, setConsent] = useState(false);
  const [cgv, setCgv] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [top, setTop] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [zipInfo, setZipInfo] = useState("");
  const [sugs, setSugs] = useState<Sug[]>([]);
  const [active, setActive] = useState(-1);
  const [sugState, setSugState] = useState<"idle" | "loading" | "none" | "error">("idle");
  const [pending, start] = useTransition();
  const hp = useRef<HTMLInputElement>(null);
  const picked = useRef("");
  const set = (k: keyof Vals, val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrs((p) => { if (!p[k]) return p; const n = { ...p }; delete n[k]; return n; });
  };
  const clearAddrErrs = () => setErrs((p) => { const n = { ...p }; delete n.address; delete n.zip; delete n.city; return n; });

  // code postal → villes correspondantes (base officielle)
  useEffect(() => {
    if (!/^\d{5}$/.test(v.zip)) { setCities([]); setZipInfo(""); return; }
    const ac = new AbortController();
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${v.zip}&fields=nom&format=json`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j: { nom: string }[]) => {
        const names = j.map((c) => c.nom).sort();
        setCities(names);
        if (!names.length) { setZipInfo("Code postal introuvable."); return; }
        setZipInfo("");
        if (names.length === 1) { setV((p) => ({ ...p, city: names[0] })); setErrs((p) => { const n = { ...p }; delete n.city; delete n.zip; return n; }); }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [v.zip]);

  // adresse → suggestions (base adresse nationale), limitées au code postal s'il est saisi
  useEffect(() => {
    const q = v.address.trim();
    if (q.length < 3 || picked.current === q || !/\p{L}{2,}/u.test(q)) { setSugs([]); setSugState("idle"); return; }
    const ac = new AbortController();
    const t = setTimeout(() => {
      setSugState("loading");
      const pc = /^\d{5}$/.test(v.zip) ? `&postcode=${v.zip}` : "";
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1${pc}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((j: { features?: { properties: { label: string; name: string; postcode: string; city: string } }[] }) => {
          const list = (j.features ?? []).map((f) => ({ label: f.properties.label, street: f.properties.name, zip: f.properties.postcode, city: f.properties.city }));
          setSugs(list); setActive(-1); setSugState(list.length ? "idle" : "none");
        })
        .catch((err) => { if ((err as Error).name !== "AbortError") setSugState("error"); });
    }, 250);
    return () => { clearTimeout(t); ac.abort(); };
  }, [v.address, v.zip]);

  if (!lines.length) return <div className="py-16 text-center"><p className="muted">Votre panier est vide.</p><Link href="/boutique" className="btn btn-primary mt-6">Voir la boutique</Link></div>;

  const choose = (s: Sug) => { picked.current = s.street; setV((p) => ({ ...p, address: s.street, zip: s.zip, city: s.city })); setSugs([]); clearAddrErrs(); };
  const onAddrKey = (e: React.KeyboardEvent) => {
    if (!sugs.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % sugs.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? sugs.length - 1 : i - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(sugs[active]); }
    else if (e.key === "Escape") setSugs([]);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(v, delivery, consent, cgv);
    setTop("");
    if (Object.keys(found).length) {
      setErrs(found);
      setTop("Merci de compléter les champs indiqués en rouge.");
      const first = ["name", "email", "phone", "address", "zip", "city", "consent", "cgv"].find((k) => found[k]);
      const el = first ? document.getElementById(first === "consent" || first === "cgv" ? `chk-${first}` : first) : null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setErrs({});
    start(async () => {
      const r = await placeOrder({ name: v.name, email: v.email, phone: v.phone, company: v.company, delivery, address: v.address, zip: v.zip, city: v.city, note: v.note, consent, cgv, website: hp.current?.value ?? "", lines: lines.map((l) => ({ slug: l.slug, qty: l.qty })) } as never);
      if (!r.ok) { setErrs(r.fields ?? {}); setTop(r.error); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      clear();
      router.push(`/boutique/merci?n=${encodeURIComponent(r.number)}`);
    });
  };
  const bad = (k: string) => (errs[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err`, style: { borderColor: "currentColor" } } : {});

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        {top && <p role="alert" className="err rounded-xl border p-4">{top}</p>}
        <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="mb-4 text-h3 font-medium">Vos coordonnées</legend>
          <F id="name" label="Nom et prénom *" error={errs.name}><input id="name" name="name" autoComplete="name" className="field" required aria-required="true" value={v.name} onChange={(e) => set("name", e.target.value.replace(/[0-9_@#$%^&*()+=<>{}[\]\\|/~]/g, ""))} {...bad("name")} /></F>
          <F id="email" label="Email (de votre compte) *" error={errs.email}><input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="field" required aria-required="true" readOnly value={v.email} {...bad("email")} /></F>
          <F id="phone" label="Téléphone" error={errs.phone}><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="06 12 34 56 78" className="field" value={v.phone} onChange={(e) => set("phone", e.target.value.replace(/[^0-9+ .()-]/g, ""))} {...bad("phone")} /></F>
          <F id="company" label="Entreprise"><input id="company" name="company" autoComplete="organization" className="field" value={v.company} onChange={(e) => set("company", e.target.value)} /></F>
        </fieldset>
        <fieldset><legend className="mb-4 text-h3 font-medium">Réception</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["livraison", "retrait"] as const).map((k) => (
              <label key={k} className={`shop-option ${delivery === k ? "is-on" : ""}`}>
                <input type="radio" name="delivery" value={k} checked={delivery === k} onChange={() => { setDelivery(k); clearAddrErrs(); }} className="sr-only" />
                <strong>{k === "livraison" ? "Livraison" : "Retrait à La Rochelle"}</strong>
                <span className="muted text-sm">{k === "livraison" ? "Frais confirmés avec la facture." : "Gratuit, sur rendez-vous."}</span>
              </label>
            ))}
          </div>
          {delivery === "livraison" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-6">
              <div className="relative sm:col-span-6">
                <F id="address" label="Adresse *" error={errs.address}>
                  <input id="address" name="address" autoComplete="off" role="combobox" aria-expanded={sugs.length > 0} aria-autocomplete="list" aria-controls="addr-list" required aria-required="true" className="field" placeholder="Numéro et rue (ex. 12 rue des Merciers)" value={v.address} onChange={(e) => { picked.current = ""; set("address", e.target.value.replace(/[^\p{L}0-9\s,.'’°#/-]/gu, "")); }} onKeyDown={onAddrKey} onBlur={() => setTimeout(() => setSugs([]), 150)} {...bad("address")} />
                </F>
                {sugState === "loading" && <p className="muted mt-1 text-[0.8rem]" aria-live="polite">Recherche de l'adresse…</p>}
                {sugState === "none" && <p className="muted mt-1 text-[0.8rem]" aria-live="polite">Aucune adresse trouvée : vérifiez la saisie ou le code postal.</p>}
                {sugState === "error" && <p className="muted mt-1 text-[0.8rem]" aria-live="polite">Suggestions indisponibles pour le moment : saisissez l'adresse complète.</p>}
                {sugs.length > 0 && (
                  <ul id="addr-list" role="listbox" className="shop-sug">
                    {sugs.map((s, i) => (<li key={s.label} role="option" aria-selected={i === active}><button type="button" tabIndex={-1} className={i === active ? "is-on" : ""} onMouseDown={(e) => { e.preventDefault(); choose(s); }}>{s.label}</button></li>))}
                  </ul>
                )}
              </div>
              <div className="sm:col-span-2"><F id="zip" label="Code postal *" error={errs.zip || zipInfo}><input id="zip" name="zip" inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code" placeholder="17000" required aria-required="true" className="field" value={v.zip} onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} {...bad("zip")} /></F></div>
              <div className="sm:col-span-4"><F id="city" label="Ville *" error={errs.city}>
                <input id="city" name="city" autoComplete="address-level2" list="city-list" required aria-required="true" className="field" placeholder={cities.length > 1 ? "Choisissez votre ville" : "Ville"} value={v.city} onChange={(e) => set("city", e.target.value.replace(/[0-9]/g, ""))} {...bad("city")} />
                <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist>
              </F></div>
            </div>
          )}
        </fieldset>
        <F id="note" label="Une précision ? (facultatif)"><textarea id="note" name="note" rows={4} className="field" value={v.note} onChange={(e) => set("note", e.target.value)} /></F>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Ne pas remplir<input ref={hp} name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="flex items-start gap-3 text-[0.9rem] leading-snug"><input id="chk-consent" type="checkbox" name="consent" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrs((p) => { const n = { ...p }; delete n.consent; return n; }); }} className="mt-1 h-5 w-5 shrink-0" aria-required="true" /><span className="muted">J&apos;accepte que QS2H utilise ces informations pour traiter ma commande (voir la <Link className="link-u acc" href="/politique-de-confidentialite" target="_blank">politique de confidentialité</Link>). *</span></label>
        {errs.consent && <p className="err" role="alert">{errs.consent}</p>}
        <label className="flex items-start gap-3 text-[0.9rem] leading-snug"><input id="chk-cgv" type="checkbox" name="cgv" checked={cgv} onChange={(e) => { setCgv(e.target.checked); setErrs((p) => { const n = { ...p }; delete n.cgv; return n; }); }} className="mt-1 h-5 w-5 shrink-0" aria-required="true" /><span className="muted">J&apos;ai lu et j&apos;accepte les <Link className="link-u acc" href="/cgv-boutique" target="_blank">conditions générales de vente</Link> de la boutique. *</span></label>
        {errs.cgv && <p className="err" role="alert">{errs.cgv}</p>}
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

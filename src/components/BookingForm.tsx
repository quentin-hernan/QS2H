"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Kind = { id: string; label: string; minutes: number; text: string };
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DOW = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const pad = (n: number) => String(n).padStart(2, "0");
const longDate = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));

/** Réservation en 3 étapes : type, jour et heure, coordonnées. Les créneaux viennent de /api/rdv (disponibilités de l'admin). */
export function BookingForm({ kinds }: { kinds: Kind[] }) {
  const [kind, setKind] = useState<Kind>(kinds[0]);
  const [dates, setDates] = useState<string[] | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [month, setMonth] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ when: string; kind: string } | null>(null);

  useEffect(() => {
    setDates(null); setDate(""); setTime(""); setSlots(null);
    fetch(`/api/rdv?kind=${kind.id}`).then((r) => r.json()).then((j) => { const d: string[] = j.ok ? j.dates : []; setDates(d); if (d[0]) setMonth(d[0].slice(0, 7)); }).catch(() => setDates([]));
  }, [kind]);
  useEffect(() => {
    if (!date) return;
    setSlots(null); setTime("");
    fetch(`/api/rdv?kind=${kind.id}&date=${date}`).then((r) => r.json()).then((j) => setSlots(j.ok ? j.slots : [])).catch(() => setSlots([]));
  }, [date, kind]);

  const avail = useMemo(() => new Set(dates ?? []), [dates]);
  const months = useMemo(() => Array.from(new Set((dates ?? []).map((d) => d.slice(0, 7)))), [dates]);
  const cells = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split("-").map(Number);
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`)] as (string | null)[];
  }, [month]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/rdv", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: kind.id, date, time, name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || "", message: fd.get("message") || "", consent: fd.get("consent") === "on" ? true : undefined, website: fd.get("website") || "" }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    if (!j?.ok) { setErr(j?.error || "Réservation impossible. Réessayez."); if (r?.status === 409) { setTime(""); setDate((d) => { setSlots(null); fetch(`/api/rdv?kind=${kind.id}&date=${d}`).then((x) => x.json()).then((y) => setSlots(y.ok ? y.slots : [])); return d; }); } return; }
    setDone({ when: j.when, kind: j.kind });
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border p-8 md:p-12" style={{ borderColor: "rgb(248 248 247 / .18)" }}>
        <p className="eyebrow mb-4">Rendez-vous confirmé</p>
        <h2 className="text-h2 font-medium">C&apos;est noté.</h2>
        <p className="mt-6 max-w-prose text-lg leading-relaxed">{done.kind}, le {done.when} (heure de Paris). Un email de confirmation avec un fichier agenda vient de vous être envoyé, ainsi qu&apos;un lien pour annuler ou déplacer le rendez-vous.</p>
      </div>
    );
  }

  const label = "mb-3 block text-[0.9rem] font-semibold";
  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <fieldset>
        <legend className={label}>1. Type d&apos;échange</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {kinds.map((k) => (
            <label key={k.id} className={`cursor-pointer rounded-2xl border p-4 transition-colors ${kind.id === k.id ? "bg-white/10" : "hover:bg-white/5"}`} style={{ borderColor: kind.id === k.id ? "rgb(var(--accent-hi))" : "rgb(248 248 247 / .2)" }}>
              <input type="radio" name="kind" className="sr-only" checked={kind.id === k.id} onChange={() => setKind(k)} />
              <span className="block font-medium">{k.label}</span>
              <span className="muted block text-sm">{k.minutes} min · {k.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>2. Jour et heure</legend>
        {dates === null ? <p className="muted">Chargement des disponibilités…</p> : dates.length === 0 ? (
          <p className="rounded-2xl border p-5" style={{ borderColor: "rgb(248 248 247 / .2)" }}>Aucun créneau n&apos;est ouvert pour le moment. Écrivez-nous via la page contact, nous vous répondons sous 24 heures ouvrées.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(260px,320px)_1fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" aria-label="Mois précédent" disabled={months.indexOf(month) <= 0} onClick={() => setMonth(months[months.indexOf(month) - 1])} className="h-11 w-11 rounded-full border disabled:opacity-30" style={{ borderColor: "rgb(248 248 247 / .2)" }}>‹</button>
                <strong className="capitalize" aria-live="polite">{MONTHS[+month.slice(5) - 1]} {month.slice(0, 4)}</strong>
                <button type="button" aria-label="Mois suivant" disabled={months.indexOf(month) >= months.length - 1} onClick={() => setMonth(months[months.indexOf(month) + 1])} className="h-11 w-11 rounded-full border disabled:opacity-30" style={{ borderColor: "rgb(248 248 247 / .2)" }}>›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm" role="grid" aria-label="Jours disponibles">
                {DOW.map((d) => <span key={d} className="muted py-1 text-xs uppercase">{d}</span>)}
                {cells.map((c, i) => c === null ? <span key={i} /> : (
                  <button key={c} type="button" disabled={!avail.has(c)} aria-pressed={date === c} aria-label={longDate(c)} onClick={() => setDate(c)}
                    className={`aspect-square rounded-full text-[0.95rem] transition-colors ${date === c ? "bg-[rgb(var(--accent))] text-white" : avail.has(c) ? "hover:bg-white/15" : "opacity-25"}`}>{+c.slice(8)}</button>
                ))}
              </div>
            </div>
            <div aria-live="polite">
              {!date ? <p className="muted">Choisissez un jour dans le calendrier.</p> : slots === null ? <p className="muted">Chargement…</p> : slots.length === 0 ? <p className="muted">Plus de créneau ce jour-là.</p> : (
                <>
                  <p className="mb-3 capitalize">{longDate(date)}</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((t) => (<button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`min-h-[44px] rounded-full border px-5 text-[0.95rem] transition-colors ${time === t ? "bg-[rgb(var(--accent))] text-white" : "hover:bg-white/10"}`} style={{ borderColor: time === t ? "transparent" : "rgb(248 248 247 / .25)" }}>{t.replace(":", " h ")}</button>))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </fieldset>

      {date && time && (
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className={label}>3. Vos coordonnées</legend>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <div><label className="label" htmlFor="rdv-name">Nom</label><input id="rdv-name" name="name" required autoComplete="name" maxLength={120} className="field" /></div>
          <div><label className="label" htmlFor="rdv-email">Email</label><input id="rdv-email" name="email" type="email" required autoComplete="email" maxLength={200} className="field" /></div>
          <div><label className="label" htmlFor="rdv-phone">Téléphone {kind.id === "decouverte" ? "(pour vous appeler)" : "(facultatif)"}</label><input id="rdv-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="field" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="rdv-msg">Votre projet en quelques mots (facultatif)</label><textarea id="rdv-msg" name="message" rows={3} maxLength={1500} className="field" /></div>
          <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" name="consent" required className="mt-1 h-5 w-5" /><span>J&apos;accepte que QS2H utilise ces informations pour organiser ce rendez-vous. <Link href="/politique-de-confidentialite" className="underline">Politique de confidentialité</Link></span></label>
          {err && <p role="alert" className="err sm:col-span-2">{err}</p>}
          <div className="sm:col-span-2"><button className="btn btn-primary btn-fill" disabled={busy}><span>{busy ? "Réservation…" : `Confirmer le ${longDate(date)} à ${time.replace(":", " h ")}`}</span></button></div>
        </fieldset>
      )}
      {!(date && time) && err && <p role="alert" className="err">{err}</p>}
    </form>
  );
}

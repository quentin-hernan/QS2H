"use client";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BUDGETS, DEADLINES, PROJECT_TYPES, quoteSchema, stepFields, type QuoteInput } from "@/lib/validators";

const DRAFT = "qs2h-devis-draft";
const STEPS = ["Projet", "Budget et délai", "Description", "Vos coordonnées"];
const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function QuoteForm({ presetPlan }: { presetPlan?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const head = useRef<HTMLHeadingElement>(null);
  const { register, handleSubmit, trigger, watch, setValue, reset, formState: { errors } } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    mode: "onTouched",
    defaultValues: { phone: "", company: "", message: "", website: "", turnstileToken: "" },
  });

  // brouillon sauvegardé localement (jamais envoyé tant que le formulaire n'est pas soumis)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT);
      if (raw) { const d = JSON.parse(raw); reset({ ...d, consent: undefined, website: "", turnstileToken: "" }); }
    } catch {}
    if (presetPlan) setValue("message", `Demande concernant : ${presetPlan}.\n`, { shouldDirty: true });
  }, [reset, presetPlan, setValue]);
  useEffect(() => {
    const sub = watch((v) => { try { localStorage.setItem(DRAFT, JSON.stringify({ ...v, consent: undefined, turnstileToken: undefined })); } catch {} });
    return () => sub.unsubscribe();
  }, [watch]);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } head.current?.focus({ preventScroll: true }); }, [step]);
  useEffect(() => {
    (window as unknown as { onTurnstile?: (t: string) => void }).onTurnstile = (t: string) => setValue("turnstileToken", t);
  }, [setValue]);

  const next = async () => { if (await trigger(stepFields[step])) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit: SubmitHandler<QuoteInput> = async (data) => {
    setSending(true); setServerError("");
    try {
      const r = await fetch("/api/devis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setServerError(j.error || "Une erreur est survenue. Réessayez ou écrivez-nous directement."); setSending(false); return; }
      try { localStorage.removeItem(DRAFT); } catch {}
      router.push("/contact/merci");
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setSending(false);
    }
  };

  const type = watch("projectType");
  const Err = ({ k }: { k: keyof QuoteInput }) => errors[k] ? <p id={`${k}-err`} role="alert" className="err">{String(errors[k]?.message)}</p> : null;
  const aria = (k: keyof QuoteInput) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined } as const);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="dark-section relative rounded-[1.5rem] border p-6 md:p-10" style={{ borderColor: "var(--s-line, var(--s-line, rgb(242 239 233 / .14)))", background: "color-mix(in srgb, var(--s-fg, #F8F8F7) 5%, var(--s-bg, #14171C))" }} aria-label="Demande de devis">
      {SITEKEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer strategy="lazyOnload" />}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[0.8rem] muted"><span>Étape {step + 1} sur {STEPS.length}</span><span>{STEPS[step]}</span></div>
        <div className="mt-3 h-px bg-current/15" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Progression du formulaire"><div className="h-px acc-bg transition-[width] duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      <h2 ref={head} tabIndex={-1} className="mb-7 text-h3 font-medium outline-none">
        {["Quel est votre projet ?", "Budget et délai", "Parlez-nous de votre activité", "Comment vous joindre ?"][step]}
      </h2>

      <div hidden={step !== 0}>
        <fieldset><legend className="sr-only">Type de projet</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TYPES.map((t) => (
              <label key={t} className={`flex min-h-[56px] cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${type === t ? "acc-border bg-[color-mix(in_srgb,currentColor_8%,transparent)]" : "hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"}`} style={type === t ? undefined : { borderColor: "var(--s-line, rgb(242 239 233 / .22))" }}>
                <input type="radio" value={t} className="peer sr-only" {...register("projectType", { onChange: () => trigger("projectType") })} />
                <span className={`h-4 w-4 shrink-0 rounded-full border ${type === t ? "acc-bg acc-border" : ""}`} style={type === t ? undefined : { borderColor: "var(--s-line, rgb(242 239 233 / .4))" }} aria-hidden="true" />
                <span className="text-[0.97rem]">{t}</span>
              </label>
            ))}
          </div>
          <Err k="projectType" />
        </fieldset>
      </div>

      <div hidden={step !== 1} className="grid gap-6">
        <div><label className="label" htmlFor="budget">Budget envisagé</label>
          <select id="budget" className="field" defaultValue="" {...register("budget", { onChange: () => trigger("budget") })} {...aria("budget")}><option value="" disabled>Choisir…</option>{BUDGETS.map((b) => <option key={b} value={b} className="text-black">{b}</option>)}</select><Err k="budget" /></div>
        <div><label className="label" htmlFor="deadline">Délai souhaité</label>
          <select id="deadline" className="field" defaultValue="" {...register("deadline", { onChange: () => trigger("deadline") })} {...aria("deadline")}><option value="" disabled>Choisir…</option>{DEADLINES.map((b) => <option key={b} value={b} className="text-black">{b}</option>)}</select><Err k="deadline" /></div>
      </div>

      <div hidden={step !== 2}>
        <label className="label" htmlFor="message">Votre projet en quelques lignes</label>
        <textarea id="message" rows={7} className="field" placeholder="Votre activité, ce que vous attendez du site, des exemples que vous aimez…" {...register("message")} {...aria("message")} /><Err k="message" />
      </div>

      <div hidden={step !== 3} className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Nom et prénom</label><input id="name" autoComplete="name" className="field" {...register("name")} {...aria("name")} /><Err k="name" /></div>
        <div><label className="label" htmlFor="email">Email professionnel</label><input id="email" type="email" autoComplete="email" className="field" {...register("email")} {...aria("email")} /><Err k="email" /></div>
        <div><label className="label" htmlFor="phone">Téléphone (facultatif)</label><input id="phone" type="tel" autoComplete="tel" className="field" {...register("phone")} {...aria("phone")} /><Err k="phone" /></div>
        <div><label className="label" htmlFor="company">Entreprise (facultatif)</label><input id="company" autoComplete="organization" className="field" {...register("company")} /></div>
        {/* honeypot : invisible pour les humains */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Ne pas remplir<input tabIndex={-1} autoComplete="off" {...register("website")} /></label></div>
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-[0.9rem] leading-snug muted">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[rgb(127,169,217)]" {...register("consent")} {...aria("consent")} />
            <span>J&apos;accepte que QS2H utilise ces informations pour répondre à ma demande. Elles sont conservées 3 ans maximum et ne sont jamais revendues. <a className="link-u acc" href="/politique-de-confidentialite" target="_blank">En savoir plus</a>.</span>
          </label><Err k="consent" />
        </div>
        {SITEKEY && <div className="sm:col-span-2"><div className="cf-turnstile" data-sitekey={SITEKEY} data-callback="onTurnstile" data-theme="auto" /></div>}
      </div>

      {serverError && <p role="alert" className="err mt-5 border border-current/30 p-3">{serverError}</p>}

      <div className="mt-9 flex items-center justify-between gap-4">
        <button type="button" onClick={prev} className="btn btn-ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }}>← Retour</button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn btn-primary">Continuer <span aria-hidden="true">→</span></button>
        ) : (
          <button type="submit" disabled={sending} className="btn btn-primary disabled:opacity-60">{sending ? "Envoi en cours…" : "Envoyer ma demande"}</button>
        )}
      </div>
      <p className="muted mt-6 text-[0.82rem]" aria-live="polite">Devis gratuit, sans engagement. Réponse sous 24 heures ouvrées.</p>
    </form>
  );
}

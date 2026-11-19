"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMe } from "@/lib/use-me";

type Msg = { role: "user" | "bot"; text: string; links?: { label: string; href: string }[] };
type Cfg = { enabled: boolean; name: string; welcome: string };
const STORE = "qs2h-chat-v1";

/** Icône de discussion : une bulle, sans effet. */
export function BotIcon({ size = 26 }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.4" />
    </svg>
  );
}

export function Chatbot() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const idRef = useRef<string>("");
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  // configuration + reprise de la conversation de la session
  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then((c: Cfg) => {
      setCfg(c);
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
        if (saved?.msgs?.length) { setMsgs(saved.msgs); idRef.current = saved.id || ""; setQuick(saved.quick || []); }
        else setMsgs([{ role: "bot", text: c.welcome }]);
      } catch { setMsgs([{ role: "bot", text: c.welcome }]); }
      setQuick((q) => (q.length ? q : ["Combien coûte un site ?", "Quels sont vos services ?", "Quel est le délai ?", "Demander un devis"]));
    }).catch(() => {});
  }, []);
  useEffect(() => { try { if (msgs.length) sessionStorage.setItem(STORE, JSON.stringify({ id: idRef.current, msgs: msgs.slice(-40), quick })); } catch { /* navigation privée */ } }, [msgs, quick]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy, form, sent]);
  useEffect(() => {
    if (open) { setTimeout(() => input.current?.focus(), 80); }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && open) { setOpen(false); launcher.current?.focus(); } };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  const send = useCallback(async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    setText(""); setErr(""); setQuick([]); setForm(false);
    setMsgs((m) => [...m, { role: "user", text: t }]);
    if (/^laisser mes coordonn/i.test(t)) { setMsgs((m) => [...m, { role: "bot", text: "Avec plaisir. Remplissez ce court formulaire, l'équipe vous répond sous 24 heures ouvrées." }]); setForm(true); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: idRef.current || undefined, message: t, page: location.pathname }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Erreur");
      idRef.current = j.id;
      await new Promise((res) => setTimeout(res, 450));
      setMsgs((m) => [...m, { role: "bot", text: j.reply, links: j.links }]);
      setQuick(j.quick || []);
      setForm(!!j.form);
    } catch (e) {
      setMsgs((m) => [...m, { role: "bot", text: e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Je rencontre un souci technique. Vous pouvez nous écrire via la page contact." , links: [{ label: "Page contact", href: "/contact" }] }]);
    } finally { setBusy(false); }
  }, [busy]);

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const payload = { conversationId: idRef.current || undefined, name: me?.name || fd.get("name"), email: me?.email || fd.get("email"), phone: me?.phone || fd.get("phone") || "", message: fd.get("message"), consent: fd.get("consent") === "on" ? true : undefined, website: fd.get("website") || "" };
    setBusy(true);
    const r = await fetch("/api/chat/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    if (!j?.ok) { setErr(j?.fields ? Object.values(j.fields as Record<string, string[]>)[0]?.[0] || j.error : j?.error || "Envoi impossible. Réessayez."); return; }
    setForm(false); setSent(true);
    setMsgs((m) => [...m, { role: "bot", text: "Merci, votre message est bien transmis. Vous recevez une confirmation par email et nous revenons vers vous sous 24 heures ouvrées." }]);
  }

  function reset() {
    idRef.current = ""; setSent(false); setForm(false); setErr("");
    setMsgs(cfg ? [{ role: "bot", text: cfg.welcome }] : []);
    setQuick(["Combien coûte un site ?", "Quels sont vos services ?", "Quel est le délai ?", "Demander un devis"]);
    try { sessionStorage.removeItem(STORE); } catch { /* */ }
  }

  if (!cfg?.enabled) return null;
  return (
    <div className="qchat" data-open={open}>
      {open && (
        <section role="dialog" aria-label={cfg.name} aria-modal="false" className="qchat-panel">
          <header className="qchat-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="qchat-avatar"><img src="/assistant-avatar.webp" alt="" width={36} height={36} /></span>
            <span className="min-w-0 flex-1"><strong className="block truncate">{cfg.name}</strong><span className="qchat-sub">Assistant automatique</span></span>
            <button type="button" onClick={reset} className="qchat-icon" aria-label="Recommencer la conversation" title="Recommencer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg></button>
            <button type="button" onClick={() => { setOpen(false); launcher.current?.focus(); }} className="qchat-icon" aria-label="Fermer l'assistant"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </header>

          <div ref={log} className="qchat-log" role="log" aria-live="polite" aria-label="Conversation">
            {msgs.map((m, i) => (
              <div key={i} className={`qchat-row ${m.role}`}>
                <div className="qchat-bubble">
                  <p>{m.text}</p>
                  {m.links && m.links.length > 0 && (<div className="qchat-links">{m.links.map((l) => (<Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="qchat-link">{l.label} →</Link>))}</div>)}
                </div>
              </div>
            ))}
            {busy && (<div className="qchat-row bot"><div className="qchat-bubble qchat-typing" aria-label="L'assistant écrit"><i /><i /><i /></div></div>)}

            {form && !sent && (
              <form onSubmit={submitLead} className="qchat-form" noValidate>
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                {me ? (
                  <p className="qchat-sub" role="status">Connecté(e) : <strong>{me.name}</strong> ({me.email}). Vos coordonnées viennent de votre compte.</p>
                ) : (
                  <>
                    <label>Nom<input name="name" required autoComplete="name" maxLength={120} /></label>
                    <label>Email<input name="email" type="email" required autoComplete="email" maxLength={200} /></label>
                  </>
                )}
                {!me?.phone && <label>Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>}
                <label>Votre demande<textarea name="message" required rows={3} maxLength={2000} defaultValue={[...msgs].reverse().find((m) => m.role === "user" && m.text.length > 12)?.text ?? ""} /></label>
                <label className="qchat-check"><input type="checkbox" name="consent" required /> <span>J&apos;accepte que QS2H utilise ces informations pour me répondre. <Link href="/politique-de-confidentialite" className="underline">Politique de confidentialité</Link></span></label>
                {err && <p role="alert" className="qchat-err">{err}</p>}
                <button className="qchat-send" disabled={busy}>{busy ? "Envoi…" : "Envoyer ma demande"}</button>
              </form>
            )}
          </div>

          {quick.length > 0 && !busy && !form && (
            <div className="qchat-quick">{quick.map((q) => (<button key={q} type="button" onClick={() => send(q)}>{q}</button>))}</div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="qchat-input">
            <label htmlFor="qchat-in" className="sr-only">Votre message</label>
            <input id="qchat-in" ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Posez votre question…" autoComplete="off" />
            <button aria-label="Envoyer" disabled={busy || !text.trim()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
          </form>
          <p className="qchat-note">Assistant automatique. Vos messages sont conservés 90 jours pour le suivi de votre demande ; ne saisissez pas de données sensibles.</p>
        </section>
      )}

            <button ref={launcher} type="button" className="qchat-launch" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}>
        {open ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg> : /* eslint-disable-next-line @next/next/no-img-element */ <img src="/assistant-avatar.webp" alt="" width={40} height={40} className="qchat-launch-img" />}
      </button>
    </div>
  );
}

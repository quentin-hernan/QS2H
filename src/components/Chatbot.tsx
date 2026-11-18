"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string; links?: { label: string; href: string }[] };
type Cfg = { enabled: boolean; name: string; welcome: string };
const STORE = "qs2h-chat-v1";

/** Robot de l'assistant : antenne, tête arrondie, oreillettes, bulle de discussion à trois points (lueur bleue). */
export function BotIcon({ size = 36, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" style={glow ? { filter: "drop-shadow(0 0 6px rgb(127 169 217 / 0.65))" } : undefined}>
      <rect x="30" y="9" width="4" height="8" rx="2" fill="#2A5587" />
      <circle cx="32" cy="7" r="5" fill="#4F83B8" />
      <rect x="3" y="26" width="7" height="16" rx="3.5" fill="#4F83B8" />
      <rect x="54" y="26" width="7" height="16" rx="3.5" fill="#4F83B8" />
      <path d="M17 17h30a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H27l-9 7 1.6-8.4A8 8 0 0 1 9 45V25a8 8 0 0 1 8-8z" fill="#12304F" stroke="#2A5587" strokeWidth="1.5" />
      <path d="M21 31q3-3 6 0M37 31q3-3 6 0" stroke="#7FA9D9" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx="25" cy="42" r="2.6" fill="#7FA9D9" /><circle cx="32" cy="42" r="2.6" fill="#7FA9D9" /><circle cx="39" cy="42" r="2.6" fill="#7FA9D9" />
    </svg>
  );
}

export function Chatbot() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState(false);
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
  // bulle d'invitation une seule fois par session
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem("qs2h-chat-hint"); } catch { /* */ }
    if (seen) return;
    const t = setTimeout(() => { setHint(true); try { sessionStorage.setItem("qs2h-chat-hint", "1"); } catch { /* */ } }, 7000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy, form, sent]);
  useEffect(() => {
    if (open) { setHint(false); setTimeout(() => input.current?.focus(), 80); }
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
    const payload = { conversationId: idRef.current || undefined, name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || "", message: fd.get("message"), consent: fd.get("consent") === "on" ? true : undefined, website: fd.get("website") || "" };
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
            <span className="qchat-avatar"><BotIcon size={30} /></span>
            <span className="min-w-0 flex-1"><strong className="block truncate">{cfg.name}</strong><span className="qchat-sub"><i /> En ligne · répond immédiatement</span></span>
            <button type="button" onClick={reset} className="qchat-icon" aria-label="Recommencer la conversation" title="Recommencer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg></button>
            <button type="button" onClick={() => { setOpen(false); launcher.current?.focus(); }} className="qchat-icon" aria-label="Fermer l'assistant"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </header>

          <div ref={log} className="qchat-log" role="log" aria-live="polite" aria-label="Conversation">
            {msgs.map((m, i) => (
              <div key={i} className={`qchat-row ${m.role}`}>
                {m.role === "bot" && <span className="qchat-mini"><BotIcon size={18} glow={false} /></span>}
                <div className="qchat-bubble">
                  <p>{m.text}</p>
                  {m.links && m.links.length > 0 && (<div className="qchat-links">{m.links.map((l) => (<Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="qchat-link">{l.label} →</Link>))}</div>)}
                </div>
              </div>
            ))}
            {busy && (<div className="qchat-row bot"><span className="qchat-mini"><BotIcon size={18} glow={false} /></span><div className="qchat-bubble qchat-typing" aria-label="L'assistant écrit"><i /><i /><i /></div></div>)}

            {form && !sent && (
              <form onSubmit={submitLead} className="qchat-form" noValidate>
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <label>Nom<input name="name" required autoComplete="name" maxLength={120} /></label>
                <label>Email<input name="email" type="email" required autoComplete="email" maxLength={200} /></label>
                <label>Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
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

      {!open && hint && (<button type="button" className="qchat-hint" onClick={() => setOpen(true)}>Une question sur votre site&nbsp;?</button>)}
      <button ref={launcher} type="button" className="qchat-launch" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}>
        <span className="qchat-halo" aria-hidden="true" />
        {open ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg> : <BotIcon size={38} />}
      </button>
    </div>
  );
}

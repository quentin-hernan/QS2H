"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Item = { title: string; text: string; href?: string };

/* ================================================================== 03 · Expertises : liste éditoriale, une ligne s'ouvre au survol, au focus ou au toucher */
export function Expertises({ items, title, lead, bg = "" }: { items: Item[]; title: string; lead: string; bg?: string }) {
  const [open, setOpen] = useState(0);
  const video = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(bg);
  return (
    <section id="expertises" className={`${bg ? "dark-section" : "light-section"} relative overflow-hidden py-24 md:py-36`} aria-labelledby="exp-h">
      {bg && (<>{video ? <video src={bg} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute inset-0 bg-ink-900/75" aria-hidden="true" /></>)}
      <div className="container relative z-10">
        <div className="mb-14 grid gap-6 md:grid-cols-12">
          <h2 id="exp-h" className="text-display font-medium md:col-span-7">{title}</h2>
          <p className="muted self-end text-[1.1rem] leading-relaxed md:col-span-4 md:col-start-9">{lead}</p>
        </div>
        <ol className="xp-list">
          {items.map((it, i) => (
            <li key={i} className="xp-row" data-open={open === i} onMouseEnter={() => setOpen(i)}>
              <button type="button" className="xp-head" aria-expanded={open === i} aria-controls={`xp-${i}`} onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>
                <span className="xp-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="xp-title">{it.title}</span>
                <span className="xp-arrow" aria-hidden="true">→</span>
              </button>
              <div id={`xp-${i}`} className="xp-body" role="region" aria-label={it.title}>
                <div>
                  <p className="max-w-xl text-[1.1rem] leading-relaxed">{it.text}</p>
                  {it.href && <Link href={it.href} className="xp-link mt-5 inline-flex">En savoir plus <span aria-hidden="true">→</span></Link>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ================================================================== 04 · Démonstrations : un écran qui change selon la solution choisie (maquettes illustratives) */
const DEMOS = [
  { id: "site", label: "Site web" },
  { id: "chat", label: "Chatbot" },
  { id: "auto", label: "Automatisation" },
  { id: "mkt", label: "Marketing" },
  { id: "matrix", label: "Matrices" },
] as const;
type DemoId = (typeof DEMOS)[number]["id"];

function DemoSite() {
  return (
    <div className="dm-site">
      <div className="dm-nav"><b /><span /><span /><span /><em /></div>
      <div className="dm-hero"><div><i className="w80" /><i className="w60" /><i className="thin w90" /><i className="thin w70" /><em /></div><div className="dm-photo" /></div>
      <div className="dm-cards"><span /><span /><span /></div>
    </div>
  );
}
function DemoChat() {
  const lines = [
    { me: true, t: "Bonjour, vous livrez le samedi ?" },
    { me: false, t: "Bonjour ! Oui, le samedi de 9 h à 13 h. Voulez-vous réserver un créneau ?" },
    { me: true, t: "Oui, samedi prochain." },
    { me: false, t: "C'est noté. Vous recevez la confirmation par email." },
  ];
  return (
    <div className="dm-chat">
      {lines.map((l, i) => (<p key={i} className={l.me ? "me" : "bot"} style={{ animationDelay: `${0.3 + i * 0.9}s` }}>{l.t}</p>))}
      <span className="dm-typing" style={{ animationDelay: `${0.3 + lines.length * 0.9}s` }}><i /><i /><i /></span>
    </div>
  );
}
function DemoAuto() {
  const steps = ["Formulaire reçu", "Contact créé dans le CRM", "Devis préparé", "Email de suivi envoyé"];
  return (
    <div className="dm-flow">
      {steps.map((s, i) => (<div key={s} className="dm-node" style={{ animationDelay: `${i * 0.5}s` }}><span className="dm-pulse" style={{ animationDelay: `${i * 0.5}s` }} />{s}</div>))}
    </div>
  );
}
function DemoMkt() {
  const bars = [38, 52, 46, 64, 58, 76, 70, 88];
  return (
    <div className="dm-mkt">
      <div className="dm-mkt-head"><span>Campagne · suivi hebdomadaire</span><em>Données fictives</em></div>
      <div className="dm-bars">{bars.map((h, i) => (<span key={i} style={{ ["--h" as string]: `${h}%`, animationDelay: `${i * 0.08}s` }} />))}</div>
      <div className="dm-legend"><span><i className="a" /> Visites</span><span><i className="b" /> Demandes de contact</span></div>
    </div>
  );
}
function DemoMatrix() {
  const rows = ["Client A", "Client B", "Client C", "Client D", "Client E"];
  return (
    <div className="dm-matrix">
      <div className="dm-fx"><b>fx</b> =SI(B2&gt;=objectif ; &quot;À relancer&quot; ; &quot;OK&quot;)</div>
      <table><thead><tr><th>Nom</th><th>Statut</th><th>Prochaine action</th></tr></thead>
        <tbody>{rows.map((r, i) => (<tr key={r} style={{ animationDelay: `${i * 0.15}s` }}><td>{r}</td><td><span className={i % 2 ? "ok" : "todo"}>{i % 2 ? "OK" : "À relancer"}</span></td><td>{i % 2 ? "—" : "Appel"}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

export function ProductDemo({ title, text }: { title: string; text: string }) {
  const [tab, setTab] = useState<DemoId>("site");
  const [paused, setPaused] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setTab((c) => DEMOS[(DEMOS.findIndex((d) => d.id === c) + 1) % DEMOS.length].id), 7000);
    return () => clearTimeout(t);
  }, [tab, paused]);
  const key = (e: React.KeyboardEvent, i: number) => {
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const j = (n + DEMOS.length) % DEMOS.length;
    setTab(DEMOS[j].id); setPaused(true); tabs.current[j]?.focus();
  };
  return (
    <section className="dark-section py-24 md:py-36" aria-labelledby="demo-h">
      <div className="container">
        <div className="mb-12 grid gap-6 md:grid-cols-12">
          <h2 id="demo-h" className="text-h1 font-medium md:col-span-7">{title}</h2>
          <p className="muted self-end leading-relaxed md:col-span-4 md:col-start-9">{text}</p>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-12" onMouseEnter={() => setPaused(true)}>
          <div role="tablist" aria-label="Choisir une solution" className="dm-tabs lg:col-span-3">
            {DEMOS.map((d, i) => (
              <button key={d.id} ref={(el) => { tabs.current[i] = el; }} role="tab" type="button" id={`dt-${d.id}`} aria-controls="dm-panel" aria-selected={tab === d.id} tabIndex={tab === d.id ? 0 : -1} onKeyDown={(e) => key(e, i)} onClick={() => { setTab(d.id); setPaused(true); }} className="dm-tab">
                <span>{d.label}</span>{tab === d.id && !paused && <i className="dm-timer" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="lg:col-span-9">
            <div className="dm-window">
              <div className="dm-bar"><i /><i /><i /><span>{DEMOS.find((d) => d.id === tab)?.label} · maquette illustrative</span></div>
              <div id="dm-panel" role="tabpanel" aria-labelledby={`dt-${tab}`} key={tab} className="dm-screen">
                {tab === "site" && <DemoSite />}
                {tab === "chat" && <DemoChat />}
                {tab === "auto" && <DemoAuto />}
                {tab === "mkt" && <DemoMkt />}
                {tab === "matrix" && <DemoMatrix />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== 06 · Méthode : une ligne qui avance avec la lecture */
export function MethodLine({ steps, title }: { steps: Item[]; title: string }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.style.setProperty("--m", "1"); return; }
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({ trigger: el, start: "top 70%", end: "bottom 60%", scrub: 0.6, onUpdate: (s) => el.style.setProperty("--m", s.progress.toFixed(3)) });
    return () => st.kill();
  }, []);
  return (
    <section ref={root} className="light-section ml-sec py-24 md:py-36" aria-labelledby="ml-h" style={{ ["--m" as string]: 0 }}>
      <div className="container">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6"><h2 id="ml-h" className="text-h1 font-medium">{title}</h2><Link href="/methode" className="xp-link">La méthode en détail <span aria-hidden="true">→</span></Link></div>
        <ol className="ml-track" style={{ ["--n" as string]: steps.length }}>
          <span className="ml-line" aria-hidden="true"><span /></span>
          {steps.map((s, i) => (
            <li key={i} className="ml-step" style={{ ["--i" as string]: i }}>
              <span className="ml-dot" aria-hidden="true" />
              <p className="ml-k">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="text-h3 font-medium">{s.title}</h3>
              <p className="muted mt-2 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ================================================================== 08 · FAQ : accordéon animé, une question ouverte à la fois */
export function HomeFaq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <section className="light-section py-24 md:py-36" aria-labelledby="hf-h">
      <div className="container grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4"><h2 id="hf-h" className="text-h1 font-medium">Questions fréquentes</h2><Link href="/faq" className="xp-link mt-8 inline-flex">Toutes les questions <span aria-hidden="true">→</span></Link></div>
        <div className="lg:col-span-8">
          <ul className="hf-list">
            {items.map((it, i) => (
              <li key={i} className="hf-item" data-open={open === i}>
                <h3><button type="button" className="hf-q" aria-expanded={open === i} aria-controls={`hf-${i}`} onClick={() => setOpen(open === i ? null : i)}><span>{it.q}</span><span className="hf-icon" aria-hidden="true" /></button></h3>
                <div id={`hf-${i}`} className="hf-a" role="region" aria-label={it.q}><div><p className="muted max-w-prose pb-7 pr-10 leading-relaxed">{it.a}</p></div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

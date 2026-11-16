"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Scènes contextuelles par page : objets en CSS 3D (transform / opacity), légers, sans WebGL supplémentaire.
   Rôle de chacune : illustrer ce que la page explique et réagir à l'action du visiteur. */

/** Cadre de portable (écran + base), inclinaison douce. `open` règle l'angle du capot (0 = fermé, 1 = ouvert). */
export function Laptop({ children, open = 1, tilt = 0, label }: { children?: ReactNode; open?: number; tilt?: number; label?: string }) {
  return (
    <div className="lp" style={{ ["--open" as string]: open, ["--tilt" as string]: `${tilt}deg` }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <div className="lp-lid"><div className="lp-screen">{children}</div></div>
      <div className="lp-base" />
    </div>
  );
}

const Bar = ({ w, d = 0, h = 8, c = "ink" }: { w: string; d?: number; h?: number; c?: "ink" | "acc" }) => (<i className={`sc-in ${c === "acc" ? "sc-acc" : "sc-ink"}`} style={{ width: w, height: h, animationDelay: `${d}ms` }} />);

/** Écran du portable selon le service (slug) : un mini-site qui se construit, une courbe qui monte, un panier, un avant/après, un tableau de bord. */
export function ServiceScreen({ slug }: { slug: string }) {
  switch (slug) {
    case "referencement-seo":
      return (
        <div className="sc"><p className="sc-t">Position Google</p>
          <svg viewBox="0 0 200 90" className="sc-svg"><path d="M5 80 C40 78 60 60 90 52 S150 28 195 8" fill="none" stroke="rgb(var(--accent))" strokeWidth="4" strokeLinecap="round" pathLength="1" className="sc-draw" /><path d="M5 85H195" stroke="currentColor" opacity=".15" /></svg>
          <div className="sc-row"><Bar w="30%" d={600} /><Bar w="20%" d={700} c="acc" /></div></div>
      );
    case "e-commerce":
      return (
        <div className="sc"><p className="sc-t">Panier</p>
          {[0, 1, 2].map((i) => (<div key={i} className="sc-row sc-in" style={{ animationDelay: `${i * 350}ms` }}><span className="sc-box" /><Bar w="45%" /><Bar w="14%" c="acc" /></div>))}
          <div className="sc-row sc-in" style={{ animationDelay: "1200ms" }}><span className="sc-btn">Payer</span></div></div>
      );
    case "refonte-de-site":
      return (
        <div className="sc sc-ba"><div className="sc-before"><Bar w="60%" h={10} /><Bar w="80%" /><Bar w="40%" /></div><div className="sc-after"><Bar w="70%" h={14} c="acc" /><div className="sc-row"><span className="sc-box" /><span className="sc-box" /><span className="sc-box" /></div></div><span className="sc-handle" /></div>
      );
    case "maintenance-hebergement":
      return (
        <div className="sc"><p className="sc-t">État du site</p>
          {["Disponibilité 99,9 %", "Sauvegarde du jour", "Mises à jour"].map((t, i) => (<div key={t} className="sc-row sc-in" style={{ animationDelay: `${i * 300}ms` }}><span className="sc-dot" /><span className="sc-l">{t}</span></div>))}</div>
      );
    case "site-sur-mesure":
      return (
        <div className="sc"><p className="sc-t">Interface dédiée</p><div className="sc-grid"><span className="sc-panel" /><span className="sc-panel" style={{ animationDelay: "300ms" }} /><span className="sc-panel sc-wide" style={{ animationDelay: "600ms" }} /></div></div>
      );
    default:
      return (
        <div className="sc"><Bar w="35%" h={10} c="acc" /><Bar w="85%" h={16} d={200} /><Bar w="60%" d={400} /><div className="sc-row sc-in" style={{ animationDelay: "700ms" }}><span className="sc-box" /><span className="sc-box" /><span className="sc-box" /></div><span className="sc-btn sc-in" style={{ animationDelay: "1000ms" }}>Contact</span></div>
      );
  }
}

type Svc = { slug: string; title: string; tagline: string; priceFrom: number; priceUnit: string };
/** Page Services : le portable reste collant ; son écran change selon le service survolé ou ciblé au clavier. */
export function ServicesStage({ services }: { services: Svc[] }) {
  const [cur, setCur] = useState(0);
  const s = services[cur] ?? services[0];
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <Laptop label={`Aperçu du service : ${s.title}`}><div key={s.slug} className="sc-wrap"><ServiceScreen slug={s.slug} /></div></Laptop>
          <p className="muted mt-6 text-center text-[0.85rem] uppercase tracking-[0.18em]" aria-live="polite">{s.title}</p>
        </div>
      </div>
      <ol className="border-t hair">
        {services.map((x, i) => (
          <li key={x.slug} className="border-b hair" onMouseEnter={() => setCur(i)} onFocus={() => setCur(i)}>
            <Link href={`/services/${x.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 py-9 transition-[padding] duration-500 hover:pl-3" data-cursor="Voir">
              <span className="muted w-8 text-[0.85rem] tabular-nums">0{i + 1}</span>
              <span><span className="block text-h3">{x.title}</span><span className="muted mt-2 block max-w-[46ch] leading-snug">{x.tagline}</span></span>
              <span className="text-right"><span className="muted block text-[0.72rem] uppercase tracking-wider">dès</span><span className="font-semibold">{new Intl.NumberFormat("fr-FR").format(x.priceFrom)} €</span></span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Page Tarifs : trois appareils de tailles croissantes ; celui de la formule survolée s'incline vers le visiteur et s'illumine. */
export function PlanDevices({ names }: { names: string[] }) {
  const [hot, setHot] = useState(-1);
  useEffect(() => {
    const over = (e: PointerEvent) => { const el = (e.target as HTMLElement).closest<HTMLElement>("[data-plan]"); setHot(el ? Number(el.dataset.plan) : -1); };
    const focus = (e: FocusEvent) => { const el = (e.target as HTMLElement).closest<HTMLElement>("[data-plan]"); if (el) setHot(Number(el.dataset.plan)); };
    document.addEventListener("pointerover", over);
    document.addEventListener("focusin", focus);
    return () => { document.removeEventListener("pointerover", over); document.removeEventListener("focusin", focus); };
  }, []);
  const kinds = ["phone", "tablet", "laptop"] as const;
  return (
    <div className="mb-14 hidden items-end justify-center gap-10 md:flex" aria-hidden="true">
      {names.slice(0, 3).map((n, i) => (
        <div key={n} className={`dev dev-${kinds[i]} ${hot === i ? "dev-hot" : ""}`}><div className="dev-body"><div className="dev-screen"><Bar w="55%" h={8} c="acc" /><Bar w="80%" d={100} /><Bar w="40%" d={200} /></div></div><p className="dev-name">{n}</p></div>
      ))}
    </div>
  );
}

/** Page Méthode : le portable se construit au fil du scroll (fil de fer, maquette, code, mise en ligne). */
export function MethodDevice({ target }: { target: string }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = document.getElementById(target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / Math.max(1, r.height)));
      setStage(Math.min(3, Math.floor(p * 4)));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [target]);
  const names = ["Fil de fer", "Maquette", "Code", "Mise en ligne"];
  return (
    <div className="sticky top-28" role="img" aria-label={`Étape illustrée : ${names[stage]}`}>
      <Laptop>
        <div className={`mb mb-${stage}`}><i className="mb-a" /><i className="mb-b" /><i className="mb-c" /><i className="mb-d" /><span className="mb-code">{"<section>"}<br />{"  <h1>…</h1>"}<br />{"</section>"}</span><span className="mb-live">En ligne</span></div>
      </Laptop>
      <p className="muted mt-5 text-center text-[0.8rem] uppercase tracking-[0.18em]">{names[stage]}</p>
    </div>
  );
}

/** Page Contact : le portable s'ouvre quand on commence le formulaire. */
export function ContactLaptop() {
  const [open, setOpen] = useState(0.15);
  useEffect(() => {
    const f = () => setOpen(1);
    const form = document.querySelector('form[aria-label="Demande de devis"]');
    form?.addEventListener("focusin", f);
    return () => form?.removeEventListener("focusin", f);
  }, []);
  return (
    <div className="mt-12 hidden max-w-sm lg:block"><Laptop open={open}><div className="sc"><p className="sc-t">Votre demande</p><Bar w="70%" h={10} c="acc" /><Bar w="50%" d={150} /><Bar w="60%" d={300} /></div></Laptop></div>
  );
}

/** Confirmation d'envoi : coche animée sur l'écran. */
export function SentLaptop() {
  return (
    <Laptop label="Demande envoyée"><div className="sc sc-center"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="23" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" pathLength="1" className="sc-draw" /><path d="M15 27l8 8 15-17" fill="none" stroke="rgb(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="sc-draw sc-draw-late" /></svg></div></Laptop>
  );
}

/** En-tête du blog : petit empilement de feuillets 3D. */
export function SheetStack() {
  return (<div className="sheets hidden md:block" aria-hidden="true">{[0, 1, 2, 3].map((i) => (<i key={i} style={{ ["--i" as string]: i }} />))}</div>);
}

/** Espace client : l'objet se construit selon l'étape en cours (une couche par étape terminée). */
export function ProjectObject({ done, total, current }: { done: number; total: number; current?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="pobj" role="img" aria-label={`Avancement : ${done} étape(s) terminée(s) sur ${total}${current ? `, en cours : ${current}` : ""}`}>
      {Array.from({ length: total }, (_, i) => (<i key={i} className={i < done ? "on" : i === done ? "cur" : ""} style={{ ["--i" as string]: i, animationDelay: `${i * 120}ms` }} />))}
    </div>
  );
}

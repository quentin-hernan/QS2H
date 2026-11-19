"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WordReveal } from "./Motion";
import { MapEmbed } from "./MapEmbed";

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

/** Confirmation d'envoi : coche animée sur l'écran. */
export function SentLaptop() {
  return (
    <Laptop label="Demande envoyée"><div className="sc sc-center"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="23" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" pathLength="1" className="sc-draw" /><path d="M15 27l8 8 15-17" fill="none" stroke="rgb(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="sc-draw sc-draw-late" /></svg></div></Laptop>
  );
}

/** Bas de la page Contact : un portable qui s'ouvre sur une carte animée (rues, Garonne, épingle) et la carte OpenStreetMap, le tout centré sous le formulaire. */
export function ContactFind({ city, area }: { city: string; area: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={root} className={`cf ${on ? "cf-on" : ""}`}>
      <p className="eyebrow cf-eyebrow"><i className="cf-rule" aria-hidden="true" />Nous trouver</p>
      <h2 className="cf-title text-h1 font-medium"><WordReveal text={`${city}, et partout en France.`} immediate={on} auto={false} step={80} className={on ? "in" : ""} /></h2>
      <p className="muted cf-lead">{area}</p>
      <div className="cf-grid">
        <div className="cf-laptop">
          <Laptop open={on ? 1 : 0.12} label={`Carte animée : ${city}`}>
            <div className="cm">
              <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect width="320" height="200" fill="rgb(var(--accent) / 0.06)" />
                <path className="cm-river" d="M-10 150C50 130 90 170 150 140S250 100 335 120" pathLength="1" />
                {["M20 20L120 60L300 30", "M40 100L160 80L310 90", "M70 10L90 190", "M170 0L150 200", "M250 10L270 190", "M10 170L300 180"].map((d, i) => (<path key={i} className="cm-street" d={d} pathLength="1" style={{ ["--i" as string]: i }} />))}
                <path className="cm-route" d="M40 170L90 130L150 112L200 78" pathLength="1" />
                <g className="cm-pin"><circle className="cm-wave" cx="200" cy="78" r="8" /><circle className="cm-wave cm-wave2" cx="200" cy="78" r="8" /><path d="M200 78c-9-12-14-18-14-26a14 14 0 0 1 28 0c0 8-5 14-14 26z" transform="translate(0 -8)" className="cm-drop" /><circle cx="200" cy="44" r="5" fill="#fff" /></g>
              </svg>
              <span className="cm-tag">{city}</span>
            </div>
          </Laptop>
        </div>
        <div className="cf-map"><MapEmbed city={city} /></div>
      </div>
    </div>
  );
}

/** Petite horloge partagée : fait avancer une étape toutes les `ms` (immobile si l'utilisateur réduit les animations). */
function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms]);
  return i;
}

/** Blog : un article s'écrit à l'écran (titre, paragraphes, image), puis passe « Publié ». */
export function BlogScene() {
  const k = useCycle(1000, 9000); // relance l'écriture toutes les 9 s
  return (
    <Laptop label="Un article de blog en cours de rédaction">
      <div key={k} className="sc bs">
        <div className="sc-row"><span className="bs-tag sc-in">Article</span><span className="bs-pub" style={{ animationDelay: "3.2s" }}>Publié</span></div>
        <Bar w="78%" h={14} d={200} /><Bar w="52%" h={14} d={420} />
        <div className="bs-body"><span className="bs-img sc-in" style={{ animationDelay: "900ms" }} /><span className="bs-lines">{[92, 86, 90, 64].map((w, i) => (<Bar key={i} w={`${w}%`} h={6} d={1200 + i * 260} />))}</span></div>
        <span className="bs-caret" />
      </div>
    </Laptop>
  );
}

/** FAQ : les questions s'ouvrent l'une après l'autre, comme sur la page. */
export function FaqScene() {
  const open = useCycle(4, 3000);
  return (
    <Laptop label="Questions et réponses qui s'ouvrent">
      <div className="sc fs">
        <p className="sc-t">Vos questions</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`fs-q ${open === i ? "is-open" : ""}`}>
            <div className="sc-row"><Bar w={`${[62, 54, 70, 48][i]}%`} h={8} /><span className="fs-plus" aria-hidden="true" /></div>
            <div className="fs-a"><Bar w="88%" h={5} /><Bar w="72%" h={5} /></div>
          </div>
        ))}
      </div>
    </Laptop>
  );
}

/** Prendre rendez-vous : un jour se sélectionne dans le calendrier, un créneau se pose, la demande part. */
export function RdvScene() {
  const days = [9, 11, 15, 18, 23];
  const step = useCycle(days.length, 3600);
  const d = days[step];
  return (
    <Laptop label="Choix d'un jour et d'un créneau dans un calendrier">
      <div className="sc rs">
        <div className="sc-row"><p className="sc-t">Novembre</p><span className="rs-slot" key={`s${step}`}>{["9 h 30", "14 h 00", "10 h 30", "16 h 00", "11 h 00"][step]}</span></div>
        <div className="rs-grid">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => (<i key={n} className={`${[6, 7, 13, 14, 20, 21, 27, 28].includes(n) ? "rs-off" : ""} ${n === d ? "rs-on" : ""}`} />))}
        </div>
        <span className="rs-ok" key={`o${step}`}><svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Créneau réservé</span>
      </div>
    </Laptop>
  );
}

/** À propos : l'équipe se présente (portraits, rôles) et l'agence se place sur la carte. */
export function AboutScene({ city = "La Rochelle" }: { city?: string }) {
  return (
    <Laptop label={`L'équipe QS2H, à ${city}`}>
      <div className="sc as">
        <p className="sc-t">L&apos;équipe</p>
        <div className="as-row">
          {[0, 1, 2].map((i) => (<div key={i} className="as-card sc-in" style={{ animationDelay: `${300 + i * 260}ms` }}><span className="as-face" /><Bar w="70%" h={6} d={600 + i * 260} /><Bar w="46%" h={5} c="acc" d={760 + i * 260} /></div>))}
        </div>
        <div className="as-map sc-in" style={{ animationDelay: "1.4s" }}>
          <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30C40 22 70 36 110 26S170 14 200 20" fill="none" stroke="rgb(var(--accent) / .45)" strokeWidth="2" pathLength="1" className="sc-draw sc-draw-late" /></svg>
          <span className="as-pin" /><span className="as-city">{city}</span>
        </div>
      </div>
    </Laptop>
  );
}

/** Page Services : l'écran du portable passe d'un service à l'autre (vitrine, sur mesure, refonte, boutique, SEO, maintenance). */
export function ServicesScene() {
  const slugs = ["site-vitrine", "site-sur-mesure", "refonte-de-site", "e-commerce", "referencement-seo", "maintenance-hebergement"];
  const names = ["Site vitrine", "Sur mesure", "Refonte", "Boutique en ligne", "Référencement", "Maintenance"];
  const i = useCycle(slugs.length, 3200);
  return (
    <div>
      <Laptop label={`Aperçu du service : ${names[i]}`}><div key={slugs[i]} className="sc-wrap"><ServiceScreen slug={slugs[i]} /></div></Laptop>
      <div className="svs-dots" aria-hidden="true">{slugs.map((s, n) => (<i key={s} className={n === i ? "is-on" : ""} />))}</div>
      <p className="muted mt-3 text-center text-[0.8rem] uppercase tracking-[0.18em]" aria-live="polite">{names[i]}</p>
    </div>
  );
}

/** Boutique : un chariot traverse la ligne sous le titre, de gauche à droite, et un colis s'y pose. */
export function CartRoll() {
  return (
    <div className="cr" aria-hidden="true">
      <span className="cr-track" />
      <span className="cr-cart">
        <svg viewBox="0 0 64 48" width="64" height="48" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect className="cr-box" x="22" y="6" width="18" height="14" rx="2" />
          <path className="cr-body" d="M2 6h8l6 24h36l6-18H14" />
          <g className="cr-wheel"><circle cx="22" cy="40" r="5" /><path d="M22 36v8M18 40h8" /></g>
          <g className="cr-wheel"><circle cx="46" cy="40" r="5" /><path d="M46 36v8M42 40h8" /></g>
        </svg>
      </span>
    </div>
  );
}

/** Tarifs : un devis dont les deux montants (formule et total) se tracent en bandes bleues, puis « Prix fixe » se pose. */
export function PriceScene() {
  const k = useCycle(1000, 8000);
  return (
    <Laptop label="Un devis au prix fixe">
      <div key={k} className="sc ps">
        <div className="sc-row"><p className="sc-t">Devis</p><span className="ps-stamp">Prix fixe</span></div>
        {[70, 55, 62].map((w, i) => (<div key={i} className="sc-row ps-line"><Bar w={`${w}%`} h={6} d={150 + i * 180} /><Bar w="16%" h={6} d={250 + i * 180} /></div>))}
        <span className="ps-band" style={{ animationDelay: "900ms" }} />
        <span className="ps-band ps-band2" style={{ animationDelay: "1300ms" }} />
      </div>
    </Laptop>
  );
}

/** Réalisations : l'écran montre trois sites de métiers différents (auto-école, menuiserie, restaurant), chacun avec sa mise en page. */
export function TradesScene() {
  const trades = [
    { name: "Auto-école", layout: "a" },
    { name: "Menuiserie", layout: "b" },
    { name: "Restaurant", layout: "c" },
  ];
  const i = useCycle(trades.length, 3400);
  const t = trades[i];
  return (
    <div>
      <Laptop label={`Exemple de site : ${t.name}`}>
        <div key={t.name} className={`sc-wrap ts ts-${t.layout}`}>
          <div className="ts-nav"><i /><span><b /><b /><b /></span></div>
          <div className="ts-hero"><span className="ts-h"><Bar w="80%" h={9} c="acc" /><Bar w="60%" h={6} d={150} /><Bar w="38%" h={14} c="acc" d={300} /></span><span className="ts-pic" /></div>
          <div className="ts-row">{[0, 1, 2].map((n) => (<span key={n} className="ts-card sc-in" style={{ animationDelay: `${450 + n * 140}ms` }} />))}</div>
        </div>
      </Laptop>
      <div className="svs-dots" aria-hidden="true">{trades.map((x, n) => (<i key={x.name} className={n === i ? "is-on" : ""} />))}</div>
      <p className="muted mt-3 text-center text-[0.8rem] uppercase tracking-[0.18em]" aria-live="polite">{t.name}</p>
    </div>
  );
}

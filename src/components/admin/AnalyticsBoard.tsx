"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalyticsData, DayPoint, Row } from "@/lib/analytics";

type MetricKey = "visitors" | "pageviews" | "avgDuration" | "bounce";
const METRICS: { key: MetricKey; label: string; upIsGood: boolean }[] = [
  { key: "visitors", label: "Visiteurs", upIsGood: true },
  { key: "pageviews", label: "Pages vues", upIsGood: true },
  { key: "avgDuration", label: "Durée moyenne d'une visite", upIsGood: true },
  { key: "bounce", label: "Taux de rebond", upIsGood: false },
];
const RANGES = [7, 28, 90] as const;

const nf = new Intl.NumberFormat("fr-FR");
const fmtDur = (s: number) => (s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`);
const fmt = (k: MetricKey, v: number) => (k === "avgDuration" ? fmtDur(v) : k === "bounce" ? `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : nf.format(Math.round(v)));
const compact = (v: number) => (v >= 10000 ? `${Math.round(v / 1000)} k` : nf.format(Math.round(v)));
const dShort = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const dLong = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
let regions: Intl.DisplayNames | null = null;
const countryName = (c: string) => { try { regions ??= new Intl.DisplayNames(["fr"], { type: "region" }); return c && c !== "Inconnu" ? regions.of(c) ?? c : "Inconnu"; } catch { return c; } };

/** Chiffre qui défile jusqu'à sa valeur (comme dans Google Analytics). */
function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(value); from.current = value; return; }
    const a = from.current, t0 = performance.now(), dur = 900;
    let raf = 0;
    const step = (t: number) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); setV(a + (value - a) * e); if (p < 1) raf = requestAnimationFrame(step); else from.current = value; };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(v)}</>;
}

function Delta({ cur, prev, upIsGood }: { cur: number; prev: number; upIsGood: boolean }) {
  if (!prev && !cur) return <span className="an-delta muted">—</span>;
  if (!prev) return <span className="an-delta muted">nouveau</span>;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0, good = up === upIsGood || Math.abs(pct) < 0.5;
  return <span className={`an-delta ${Math.abs(pct) < 0.5 ? "muted" : good ? "is-good" : "is-bad"}`}><span aria-hidden="true">{up ? "▲" : "▼"}</span> {Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</span>;
}

/** Courbe principale : période choisie (accent, aire légère) et période précédente (gris), réticule et bulle au survol. */
function MainChart({ series, prev, metric }: { series: DayPoint[]; prev: DayPoint[]; metric: MetricKey }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 260, L = 44, R = 12, T = 14, B = 28;
  const vals = series.map((p) => p[metric]), pvals = prev.map((p) => p[metric]);
  const max = Math.max(1, ...vals, ...pvals);
  const nice = (() => { const raw = max / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); const n = [1, 2, 2.5, 5, 10].find((s) => s * mag >= raw)! * mag; return metric === "avgDuration" ? Math.ceil(raw / 30) * 30 : metric === "bounce" ? Math.ceil(raw / 10) * 10 : Math.max(1, n); })();
  const top = nice * 4;
  const x = (i: number) => L + (series.length <= 1 ? 0 : (i / (series.length - 1)) * (w - L - R));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const line = path(vals);
  const area = `${line}L${x(vals.length - 1).toFixed(1)} ${y(0)}L${x(0).toFixed(1)} ${y(0)}Z`;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * nice);
  const every = Math.ceil(series.length / 7);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    const i = Math.round(((px - L) / (w - L - R)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const key = `${metric}-${series.length}-${series[0]?.date}`;
  return (
    <div ref={box} className="an-chart">
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Évolution : ${METRICS.find((m) => m.key === metric)?.label}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (<g key={t}><line x1={L} x2={w - R} y1={y(t)} y2={y(t)} className="an-grid" /><text x={L - 8} y={y(t) + 4} textAnchor="end" className="an-tick">{metric === "avgDuration" ? fmtDur(t) : metric === "bounce" ? `${t} %` : compact(t)}</text></g>))}
        {series.map((p, i) => (i % every === 0 || i === series.length - 1 ? <text key={p.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} className="an-tick">{dShort(p.date)}</text> : null))}
        <path d={path(pvals)} className="an-prev" key={`p${key}`} pathLength={1} />
        <path d={area} className="an-area" key={`a${key}`} />
        <path d={line} className="an-line" key={`l${key}`} pathLength={1} />
        {hover !== null && (<g><line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="an-cross" /><circle cx={x(hover)} cy={y(pvals[hover] ?? 0)} r={4} className="an-dot-prev" /><circle cx={x(hover)} cy={y(vals[hover])} r={5} className="an-dot" /></g>)}
      </svg>
      {hover !== null && (
        <div className="an-tip" style={{ left: `${(x(hover) / w) * 100}%` }} role="status">
          <p className="an-tip-d">{dLong(series[hover].date)}</p>
          <p><i className="an-key" /> <strong>{fmt(metric, vals[hover])}</strong> <span className="muted">période choisie</span></p>
          <p><i className="an-key an-key-prev" /> <strong>{fmt(metric, pvals[hover] ?? 0)}</strong> <span className="muted">{prev[hover] ? dShort(prev[hover].date) : "période précédente"}</span></p>
        </div>
      )}
    </div>
  );
}

/** Liste classée avec barres horizontales (une seule couleur : la longueur porte la valeur). */
function Bars({ title, rows, unit, label = (s: string) => s, empty }: { title: string; rows: Row[]; unit: string; label?: (s: string) => string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0);
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t); }, [rows]);
  return (
    <section className="an-card" aria-label={title}>
      <div className="an-card-h"><h3>{title}</h3><span className="muted text-xs">{unit}</span></div>
      {rows.length === 0 ? <p className="muted py-6 text-sm">{empty}</p> : (
        <ul className="an-bars">
          {rows.map((r) => (
            <li key={r.label} title={`${label(r.label)} : ${nf.format(r.value)} ${unit} (${Math.round((r.value / Math.max(1, total)) * 100)} %)`}>
              <span className="an-bar-l">{label(r.label)}</span>
              <span className="an-bar-v">{nf.format(r.value)}</span>
              <span className="an-bar-t"><span className="an-bar-f" style={{ width: on ? `${(r.value / max) * 100}%` : 0 }} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Tableau de bord d'audience façon Google Analytics : période, indicateurs comparés, courbe, temps réel, pages, sources, appareils, pays, navigateurs. */
export function AnalyticsBoard() {
  const [days, setDays] = useState<number>(28);
  const [metric, setMetric] = useState<MetricKey>("visitors");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback((d: number) => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${d}`, { cache: "no-store" }).then((r) => r.json()).then((j) => { if (j.ok) { setData(j.data); setErr(""); } else setErr("Statistiques indisponibles."); }).catch(() => setErr("Statistiques indisponibles.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(days); }, [days, load]);
  // temps réel : rafraîchi toutes les 30 secondes
  useEffect(() => { const t = setInterval(() => load(days), 30000); return () => clearInterval(t); }, [days, load]);

  const k = data?.kpis, p = data?.prev;
  const pmax = useMemo(() => Math.max(1, ...(data?.realtime.perMinute ?? [0])), [data]);
  return (
    <section aria-labelledby="an-h" className={`an ${loading && data ? "is-loading" : ""}`}>
      <div className="an-top">
        <div><h2 id="an-h" className="text-xl font-medium">Audience du site</h2><p className="muted text-sm">Visites des personnes ayant accepté la mesure d&apos;audience · {days} derniers jours comparés aux {days} précédents</p></div>
        <div className="an-range" role="group" aria-label="Période">
          {RANGES.map((r) => (<button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>{r} jours</button>))}
        </div>
      </div>
      {err && data && <p className="err text-sm">{err}</p>}
      {!data ? <div className="an-card an-skel" aria-busy={!err}><p className="muted">{err ? "Les statistiques n'ont pas pu être chargées. Réessayez dans un instant." : "Chargement des statistiques…"}</p></div> : (
        <>
          <div className="an-main">
            <div className="an-card an-card-chart">
              <div className="an-tabs" role="tablist" aria-label="Indicateur affiché">
                {METRICS.map((m) => (
                  <button key={m.key} type="button" role="tab" aria-selected={metric === m.key} className="an-tab" onClick={() => setMetric(m.key)}>
                    <span className="an-tab-l">{m.label}</span>
                    <span className="an-tab-v"><CountUp value={k![m.key]} format={(v) => fmt(m.key, v)} /></span>
                    <Delta cur={k![m.key]} prev={p![m.key]} upIsGood={m.upIsGood} />
                  </button>
                ))}
              </div>
              <div className="an-legend"><span><i className="an-key" /> {days} derniers jours</span><span><i className="an-key an-key-prev" /> période précédente</span></div>
              <MainChart series={data.series} prev={data.prevSeries} metric={metric} />
              <p className="muted mt-2 text-xs">{nf.format(k!.sessions)} visites · {k!.perSession.toLocaleString("fr-FR")} pages par visite</p>
              <details className="an-table"><summary className="muted text-xs underline">Voir les données jour par jour</summary>
                <div className="overflow-x-auto"><table><thead><tr><th>Jour</th><th>Visiteurs</th><th>Pages vues</th><th>Durée moyenne</th><th>Rebond</th></tr></thead>
                  <tbody>{[...data.series].reverse().map((d) => (<tr key={d.date}><td>{dShort(d.date)}</td><td>{nf.format(d.visitors)}</td><td>{nf.format(d.pageviews)}</td><td>{fmtDur(d.avgDuration)}</td><td>{d.bounce} %</td></tr>))}</tbody></table></div>
              </details>
            </div>
            <aside className="an-card an-rt" aria-label="Temps réel">
              <p className="muted text-xs uppercase tracking-[0.12em]">Visiteurs en ce moment</p>
              <p className="an-rt-n"><span className="an-pulse" aria-hidden="true" /><CountUp value={data.realtime.now} format={(v) => nf.format(Math.round(v))} /></p>
              <p className="muted text-xs">sur les 5 dernières minutes</p>
              <p className="muted mt-5 text-xs">Pages vues par minute (30 dernières minutes)</p>
              <div className="an-mini" aria-hidden="true">{data.realtime.perMinute.map((n, i) => (<i key={i} style={{ height: `${Math.max(4, (n / pmax) * 100)}%`, animationDelay: `${i * 18}ms` }} className={n ? "" : "is-zero"} />))}</div>
              <ul className="mt-4 space-y-1.5 text-sm">{data.realtime.pages.length ? data.realtime.pages.map((r) => (<li key={r.label} className="flex justify-between gap-3"><span className="truncate">{r.label}</span><span className="muted">{r.value}</span></li>)) : <li className="muted">Personne pour l&apos;instant.</li>}</ul>
            </aside>
          </div>
          <div className="an-grid-cards">
            <Bars title="Pages les plus vues" rows={data.pages} unit="vues" empty="Aucune page vue sur la période." />
            <Bars title="D'où viennent les visiteurs" rows={data.sources} unit="visites" empty="Aucune visite sur la période." />
            <Bars title="Appareils" rows={data.devices} unit="visites" empty="—" />
            <Bars title="Pays" rows={data.countries} unit="visites" label={countryName} empty="—" />
            <Bars title="Navigateurs" rows={data.browsers} unit="visites" empty="—" />
          </div>
          {data.total === 0 && <p className="muted text-sm">Aucune visite enregistrée pour l&apos;instant : les statistiques apparaîtront dès les premières visites de personnes ayant accepté la mesure d&apos;audience.</p>}
        </>
      )}
    </section>
  );
}

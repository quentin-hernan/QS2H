import "server-only";
import { db } from "./db";

type V = { at: Date; path: string; visitor: string; session: string; source: string; device: string; browser: string; country: string; duration: number };
export type Kpis = { visitors: number; sessions: number; pageviews: number; avgDuration: number; bounce: number; perSession: number };
export type DayPoint = { date: string } & Kpis;
export type Row = { label: string; value: number; extra?: number };
export type AnalyticsData = {
  days: number;
  kpis: Kpis; prev: Kpis;
  series: DayPoint[]; prevSeries: DayPoint[];
  pages: Row[]; sources: Row[]; devices: Row[]; countries: Row[]; browsers: Row[];
  realtime: { now: number; perMinute: number[]; pages: Row[] };
  total: number;
};

const TZ = "Europe/Paris";
const dayKey = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

function kpis(vs: V[]): Kpis {
  const visitors = new Set(vs.map((v) => v.visitor)).size;
  const bySession = new Map<string, { n: number; d: number }>();
  for (const v of vs) { const s = bySession.get(v.session) ?? { n: 0, d: 0 }; s.n++; s.d += v.duration; bySession.set(v.session, s); }
  const sessions = bySession.size;
  const bounces = [...bySession.values()].filter((s) => s.n === 1).length;
  const dur = [...bySession.values()].reduce((a, s) => a + s.d, 0);
  return {
    visitors, sessions, pageviews: vs.length,
    avgDuration: sessions ? Math.round(dur / sessions) : 0,
    bounce: sessions ? Math.round((bounces / sessions) * 1000) / 10 : 0,
    perSession: sessions ? Math.round((vs.length / sessions) * 100) / 100 : 0,
  };
}
function top(vs: V[], key: (v: V) => string, by: "views" | "sessions" = "views", n = 8): Row[] {
  const m = new Map<string, Set<string> | number>();
  for (const v of vs) {
    const k = key(v) || "Inconnu";
    if (by === "views") m.set(k, ((m.get(k) as number) ?? 0) + 1);
    else { const s = (m.get(k) as Set<string>) ?? new Set<string>(); s.add(v.session); m.set(k, s); }
  }
  return [...m.entries()].map(([label, x]) => ({ label, value: typeof x === "number" ? x : x.size })).sort((a, b) => b.value - a.value).slice(0, n);
}
function seriesOf(vs: V[], start: Date, days: number): DayPoint[] {
  const byDay = new Map<string, V[]>();
  for (const v of vs) { const k = dayKey(v.at); (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(v); }
  return Array.from({ length: days }, (_, i) => { const d = new Date(start.getTime() + i * 864e5); const k = dayKey(d); return { date: k, ...kpis(byDay.get(k) ?? []) }; });
}

/** Statistiques de la période (7, 28 ou 90 jours) comparées à la période précédente de même durée, et temps réel. */
export async function getAnalytics(days: number): Promise<AnalyticsData> {
  const now = Date.now();
  const start = new Date(now - days * 864e5), prevStart = new Date(now - 2 * days * 864e5);
  const select = { at: true, path: true, visitor: true, session: true, source: true, device: true, browser: true, country: true, duration: true } as const;
  // ménage : conservation 14 mois (recommandation CNIL pour la mesure d'audience)
  if (Math.random() < 0.05) await db.pageView.deleteMany({ where: { at: { lt: new Date(now - 425 * 864e5) } } }).catch(() => null);
  const [all, recent] = await Promise.all([
    db.pageView.findMany({ where: { at: { gte: prevStart } }, select, orderBy: { at: "asc" }, take: 300000 }),
    db.pageView.findMany({ where: { at: { gte: new Date(now - 30 * 60e3) } }, select: { at: true, path: true, visitor: true }, orderBy: { at: "asc" } }),
  ]);
  const cur = all.filter((v) => v.at >= start), prev = all.filter((v) => v.at < start);
  const sessionsSources = new Map<string, string>();
  for (const v of cur) if (!sessionsSources.has(v.session)) sessionsSources.set(v.session, v.source);
  const fiveMin = recent.filter((v) => v.at.getTime() >= now - 5 * 60e3);
  const perMinute = Array.from({ length: 30 }, (_, i) => recent.filter((v) => { const m = Math.floor((now - v.at.getTime()) / 60e3); return m === 29 - i; }).length);
  return {
    days,
    kpis: kpis(cur), prev: kpis(prev),
    series: seriesOf(cur, new Date(start.getTime() + 864e5), days), prevSeries: seriesOf(prev, new Date(prevStart.getTime() + 864e5), days),
    pages: top(cur, (v) => v.path),
    sources: [...[...sessionsSources.values()].reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map<string, number>()).entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    devices: top(cur, (v) => v.device, "sessions", 3),
    countries: top(cur, (v) => v.country, "sessions", 6),
    browsers: top(cur, (v) => v.browser, "sessions", 5),
    realtime: { now: new Set(fiveMin.map((v) => v.visitor)).size, perMinute, pages: top(fiveMin as V[], (v) => v.path, "views", 4) },
    total: await db.pageView.count(),
  };
}

import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { getSettings } from "./content";
import { defaultSettings } from "./defaults";

export const KINDS = [
  { id: "decouverte", label: "Appel découverte", minutes: 20, text: "Par téléphone, pour cadrer votre besoin." },
  { id: "visio", label: "Visio", minutes: 45, text: "Présentation de votre projet et démonstration." },
  { id: "sur-place", label: "Rendez-vous sur place", minutes: 60, text: "À La Rochelle ou en Charente-Maritime." },
] as const;
export type KindId = (typeof KINDS)[number]["id"];
export const kindById = (id: string) => KINDS.find((k) => k.id === id);

const TZ = "Europe/Paris";
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function offsetAt(ts: number) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ts / 1000) * 1000;
}
/** Heure « murale » Europe/Paris → instant UTC (gère l'heure d'été). */
export function parisToDate(date: string, hhmm: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}
export function parisParts(d: Date) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const addDays = (date: string, n: number) => { const [y, m, d] = date.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const weekday = (date: string) => new Date(date + "T12:00:00Z").getUTCDay();

type Rules = { windows: Record<string, [number, number][]>; buffer: number; maxPerDay: number; notice: number; horizon: number; closed: Set<string> };
const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + (m || 0); };
export async function getRules(): Promise<Rules> {
  const b = { ...defaultSettings.booking, ...(((await getSettings()).booking as Record<string, string> | undefined) ?? {}) } as Record<string, string>;
  const windows: Rules["windows"] = {};
  for (const d of DAYS) {
    windows[d] = String(b[d] ?? "").split(",").map((r) => r.trim().match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/)).filter((x): x is RegExpMatchArray => !!x).map((x) => [toMin(x[1]), toMin(x[2])] as [number, number]).filter(([a, z]) => z > a);
  }
  const num = (v: unknown, def: number) => { const n = parseInt(String(v), 10); return Number.isFinite(n) && n >= 0 ? n : def; };
  return { windows, buffer: num(b.buffer, 15), maxPerDay: Math.max(1, num(b.maxPerDay, 6)), notice: num(b.noticeHours, 24), horizon: Math.min(180, Math.max(1, num(b.horizonDays, 45))), closed: new Set(String(b.closed ?? "").split(/[,\s;]+/).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))) };
}

/** Créneaux libres (heures de début « HH:MM », heure de Paris) pour chaque date demandée. */
export async function freeSlots(dates: string[], minutes: number, rules?: Rules): Promise<Record<string, string[]>> {
  const r = rules ?? (await getRules());
  const lo = parisToDate(dates[0], "00:00"), hi = parisToDate(addDays(dates[dates.length - 1], 1), "00:00");
  const busy = await db.appointment.findMany({ where: { status: "confirmé", startsAt: { gte: new Date(lo.getTime() - 864e5), lt: hi } } });
  const earliest = Date.now() + r.notice * 3600e3;
  const out: Record<string, string[]> = {};
  for (const date of dates) {
    out[date] = [];
    if (r.closed.has(date)) continue;
    const day = busy.filter((a) => parisParts(a.startsAt).date === date);
    if (day.length >= r.maxPerDay) continue;
    for (const [from, to] of r.windows[DAYS[weekday(date)]] ?? []) {
      for (let t = from; t + minutes <= to; t += 30) {
        const hhmm = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
        const s = parisToDate(date, hhmm), e = new Date(s.getTime() + minutes * 60e3);
        if (s.getTime() < earliest) continue;
        const clash = busy.some((a) => s.getTime() < a.endsAt.getTime() + r.buffer * 60e3 && e.getTime() + r.buffer * 60e3 > a.startsAt.getTime());
        if (!clash) out[date].push(hhmm);
      }
    }
  }
  return out;
}
export async function availableDates(minutes: number) {
  const r = await getRules();
  const today = parisParts(new Date()).date;
  const dates = Array.from({ length: r.horizon }, (_, i) => addDays(today, i));
  const slots = await freeSlots(dates, minutes, r);
  return dates.filter((d) => slots[d].length > 0);
}

export const newToken = () => crypto.randomBytes(24).toString("base64url");

/** Fichier .ics (UTC) à joindre à l'email de confirmation. */
export function ics(a: { id: string; startsAt: Date; endsAt: Date; title: string; description: string; location: string }) {
  const z = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QS2H//Rendez-vous//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${a.id}@qs2h.fr`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(a.startsAt)}`, `DTEND:${z(a.endsAt)}`, `SUMMARY:${esc(a.title)}`, `DESCRIPTION:${esc(a.description)}`, `LOCATION:${esc(a.location)}`, "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${esc(a.title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export const fmtLong = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

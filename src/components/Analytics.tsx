"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CONSENT = "qs2h-consent-v1";
const allowed = () => {
  try {
    if (/(?:^|; )qs2h_ui=1/.test(document.cookie)) return false; // l'administrateur ne se compte pas lui-même
    return !!JSON.parse(localStorage.getItem(CONSENT) || "null")?.analytics;
  } catch { return false; }
};

/** Mesure d'audience interne : une page vue par changement de page, puis le temps passé (envoyé en quittant la page). Seulement avec l'accord du visiteur. */
export function Analytics() {
  const path = usePathname();
  const cur = useRef<{ id: string; t: number; hidden: number; since: number } | null>(null);

  useEffect(() => {
    const flush = () => {
      const c = cur.current;
      if (!c) return;
      const visible = (Date.now() - c.t - c.hidden - (document.hidden && c.since ? Date.now() - c.since : 0)) / 1000;
      navigator.sendBeacon?.("/api/a", new Blob([JSON.stringify({ id: c.id, d: Math.round(visible) })], { type: "application/json" }));
    };
    const vis = () => {
      const c = cur.current;
      if (!c) return;
      if (document.hidden) { c.since = Date.now(); flush(); } else if (c.since) { c.hidden += Date.now() - c.since; c.since = 0; }
    };
    addEventListener("visibilitychange", vis);
    addEventListener("pagehide", flush);
    return () => { removeEventListener("visibilitychange", vis); removeEventListener("pagehide", flush); };
  }, []);

  useEffect(() => {
    // page précédente : on envoie sa durée avant d'en compter une nouvelle
    if (cur.current) {
      const c = cur.current;
      navigator.sendBeacon?.("/api/a", new Blob([JSON.stringify({ id: c.id, d: Math.round((Date.now() - c.t - c.hidden) / 1000) })], { type: "application/json" }));
      cur.current = null;
    }
    const send = () => {
      if (!allowed()) return;
      const q = new URLSearchParams(location.search);
      const first = !sessionStorage.getItem("qs2h-a");
      try { sessionStorage.setItem("qs2h-a", "1"); } catch { /* */ }
      fetch("/api/a", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ p: path, r: first ? document.referrer : "", w: innerWidth, s: q.get("utm_source") || undefined }) })
        .then((r) => (r.ok && r.status !== 204 ? r.json() : null))
        .then((j) => { if (j?.id) cur.current = { id: j.id, t: Date.now(), hidden: 0, since: 0 }; })
        .catch(() => {});
    };
    const t = setTimeout(send, 400);
    const onConsent = () => { if (!cur.current) send(); };
    addEventListener("qs2h:consent-given", onConsent);
    return () => { clearTimeout(t); removeEventListener("qs2h:consent-given", onConsent); };
  }, [path]);
  return null;
}

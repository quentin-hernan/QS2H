"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Notice = { id: string; createdAt: string; kind: string; title: string; body: string; link: string; readAt: string | null };

const ICONS: Record<string, string> = {
  message: "M4 5h16v11H8l-4 4z", panier: "M5 8h14l-1.5 11h-11zM9 8a3 3 0 0 1 6 0", rdv: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4",
  devis: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5", commande: "M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9", demande: "M5 19l3-1 10-10-2-2L6 16zM14 6l2 2",
  compte: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0", statut: "M5 12l4 4 10-10", document: "M7 3h7l4 4v14H7zM14 3v4h4",
};
const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
const Icon = ({ kind }: { kind: string }) => (
  <span className={`nb-ic nb-ic-${kind}`} aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[kind] ?? ICONS.statut} /></svg></span>
);

/**
 * Cloche de notifications (administration ou espace client) : badge du nombre non lu, liste déroulante,
 * et bulle qui glisse à l'écran à l'arrivée d'une nouvelle notification. Vérifie toutes les 15 s (onglet visible seulement).
 */
export function NoticeBell({ endpoint, label = "Notifications" }: { endpoint: string; label?: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Notice[]>([]);
  const [bump, setBump] = useState(0);
  const seen = useRef<Set<string> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number }>({ top: 64, left: 8, maxH: 480 });
  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(380, window.innerWidth * 0.86);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    setPos({ top: r.bottom + 10, left, maxH: Math.max(220, window.innerHeight - r.bottom - 24) });
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(endpoint, { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items: Notice[]; unread: number };
      setItems(j.items);
      setUnread((u) => { if (j.unread > u) setBump((b) => b + 1); return j.unread; });
      if (seen.current) {
        const fresh = j.items.filter((n) => !seen.current!.has(n.id) && !n.readAt).slice(0, 3);
        if (fresh.length) { setToasts((t) => [...fresh, ...t].slice(0, 3)); window.dispatchEvent(new Event("qs2h:notice")); }
      }
      seen.current = new Set(j.items.map((n) => n.id));
    } catch { /* réseau */ }
  }, [endpoint]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15000);
    const vis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [load]);
  // les bulles disparaissent seules après 7 s
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((x) => x.slice(0, -1)), 7000);
    return () => clearTimeout(t);
  }, [toasts]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); window.removeEventListener("resize", place); };
  }, [open, place]);

  const markAll = async () => {
    await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) }).catch(() => null);
    setUnread(0); setItems((x) => x.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };
  const markOne = (id: string) => {
    fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: [id] }) }).catch(() => null);
    if (items.some((n) => n.id === id && !n.readAt)) setUnread((u) => Math.max(0, u - 1));
    setItems((x) => x.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setToasts((t) => t.filter((n) => n.id !== id));
    setOpen(false);
  };

  return (
    <div ref={root} className="nb">
      <button ref={btn} type="button" className={`nb-btn ${unread ? "has" : ""}`} aria-label={`${label}${unread ? ` : ${unread} non lue${unread > 1 ? "s" : ""}` : ""}`} aria-expanded={open} onClick={() => { place(); setOpen((o) => !o); }}>
        <svg key={bump} className={bump ? "nb-ring" : ""} viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" /></svg>
        {unread > 0 && <span key={`b${bump}`} className="nb-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="nb-panel" role="dialog" aria-label={label} style={{ top: pos.top, left: pos.left, maxHeight: pos.maxH }}>
          <div className="nb-head"><strong>{label}</strong>{unread > 0 && <button type="button" className="text-sm underline" onClick={markAll}>Tout marquer comme lu</button>}</div>
          {items.length === 0 ? <p className="nb-empty">Aucune notification pour l&apos;instant.</p> : (
            <ul className="nb-list">
              {items.map((n, i) => (
                <li key={n.id} style={{ animationDelay: `${i * 35}ms` }} className={n.readAt ? "" : "is-new"}>
                  <Link href={n.link || "#"} onClick={() => markOne(n.id)}>
                    <Icon kind={n.kind} />
                    <span className="min-w-0 flex-1"><span className="nb-t">{n.title}</span>{n.body && <span className="nb-b">{n.body}</span>}<span className="nb-d">{ago(n.createdAt)}</span></span>
                    {!n.readAt && <i className="nb-dot" aria-label="non lue" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="nb-toasts" aria-live="polite">
        {toasts.map((n) => (
          <div key={n.id} className="nb-toast" role="status">
            <Icon kind={n.kind} />
            <Link href={n.link || "#"} onClick={() => markOne(n.id)} className="min-w-0 flex-1"><span className="nb-t">{n.title}</span>{n.body && <span className="nb-b">{n.body}</span>}</Link>
            <button type="button" aria-label="Fermer" className="nb-x" onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}>✕</button>
            <i className="nb-timer" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

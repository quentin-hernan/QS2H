"use client";
import { useEffect, useRef, useState } from "react";

export type MediaItem = { id: string; url: string; alt: string; width: number; height: number; kind?: string };

/** Sélecteur de média : bibliothèque + import (texte alternatif obligatoire). Utilise <dialog> (focus piégé nativement). */
export function MediaPicker({ open, onClose, onPick, onRemove, removeLabel = "Retirer l'image" }: { open: boolean; onClose: () => void; onPick: (m: MediaItem) => void; onRemove?: () => void; removeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tab, setTab] = useState<"lib" | "up">("lib");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); fetch("/api/admin/media").then((r) => r.json()).then((j) => j.ok && setItems(j.media)); }
    if (!open && d.open) d.close();
  }, [open]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({ ok: false, error: "Erreur réseau." }));
    setBusy(false);
    if (!j.ok) return setErr(j.error);
    setAlt(""); (e.target as HTMLFormElement).reset();
    onPick(j.media);
  }

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label="Choisir une image ou une vidéo" className="dark-section m-auto w-[min(920px,94vw)] rounded-2xl border p-0 backdrop:bg-black/70" style={{ borderColor: "rgb(242 239 233 / .16)", background: "#242424", color: "#F8F8F7" }}>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-2" role="tablist">
            {(["lib", "up"] as const).map((t) => (<button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm ${tab === t ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`}>{t === "lib" ? "Bibliothèque" : "Importer un fichier"}</button>))}
          </div>
          <span className="flex items-center gap-2">{onRemove && <button type="button" onClick={onRemove} className="err rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: "currentColor" }}>{removeLabel}</button>}<button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm hover:bg-white/10" aria-label="Fermer">✕</button></span>
        </div>
        {tab === "lib" ? (
          items.length === 0 ? <p className="muted py-10 text-center">Aucun média. Importez-en un.</p> : (
            <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 md:grid-cols-4">
              {items.map((m) => (
                <li key={m.id}><button type="button" onClick={() => onPick(m)} className="group block w-full overflow-hidden rounded-xl border text-left" style={{ borderColor: "rgb(242 239 233 / .16)" }}>
                  {m.kind === "video" ? (
                    <span className="relative block"><video src={m.url} muted preload="metadata" className="aspect-[4/3] w-full object-cover" /><span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider">Vidéo</span></span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                  <span className="muted block truncate p-2 text-xs">{m.alt}</span></button></li>
              ))}
            </ul>
          )
        ) : (
          <form onSubmit={upload} className="grid gap-5">
            <div><label className="label" htmlFor="mp-file">Image (JPEG, PNG, WebP, AVIF, GIF — 12 Mo max) ou vidéo (MP4, WebM, MOV — 80 Mo max)</label><input id="mp-file" name="file" type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg" required className="field" /></div>
            <div><label className="label" htmlFor="mp-alt">Texte alternatif (obligatoire)</label><input id="mp-alt" name="alt" value={alt} onChange={(e) => setAlt(e.target.value)} required className="field" placeholder="Décrivez le visuel pour les personnes qui ne le voient pas" /></div>
            {err && <p role="alert" className="err">{err}</p>}
            <p className="muted text-sm">Les images sont automatiquement redimensionnées (2400 px max) et converties en WebP. Les vidéos sont publiées telles quelles : privilégiez un MP4 (H.264) de moins de 20 Mo, en 16:9.</p>
            <button className="btn btn-primary self-start" disabled={busy}>{busy ? "Import…" : "Importer et utiliser"}</button>
          </form>
        )}
      </div>
    </dialog>
  );
}

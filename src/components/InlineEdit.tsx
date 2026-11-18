"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { mediaSrc, mediaTargets, textTargets, type PageOverrides } from "@/lib/overrides";
import { resetOverrides, saveOverride } from "@/app/admin/section-actions";

const MediaPicker = dynamic(() => import("./admin/MediaPicker").then((m) => m.MediaPicker), { ssr: false });

/** Édition directe sur la page : double-clic sur un texte pour le réécrire, clic sur une image ou une vidéo pour la remplacer. */
export function InlineEdit({ path, local }: { path: string; local: PageOverrides | undefined }) {
  const [pick, setPick] = useState<null | { el: HTMLElement; idx: number }>(null);
  const [msg, setMsg] = useState("");
  const ov = useRef<PageOverrides>(JSON.parse(JSON.stringify(local ?? {})));
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };

  // repères visuels + écoute
  useEffect(() => {
    const mark = () => { textTargets().forEach((e) => e.setAttribute("data-ov", "t")); mediaTargets().forEach((e) => e.setAttribute("data-ov", "m")); };
    mark();
    const iv = setInterval(mark, 1500);

    const onDbl = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-ov='t']");
      if (!el || el.isContentEditable) return;
      e.preventDefault(); e.stopPropagation();
      const idx = textTargets().indexOf(el);
      if (idx < 0) return;
      const before = el.dataset.ovDone ?? (el.textContent || "").trim();
      el.contentEditable = "plaintext-only";
      if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
      el.classList.add("sx-typing");
      el.focus();
      getSelection()?.selectAllChildren(el);
      let cancelled = false;
      const done = async () => {
        el.removeEventListener("blur", done); el.removeEventListener("keydown", key);
        el.removeAttribute("contenteditable"); el.classList.remove("sx-typing");
        const now = (el.textContent || "").trim();
        if (cancelled || now === before) { el.textContent = before; return; }
        const orig = ov.current.t?.[String(idx)]?.o ?? before;
        const r = await saveOverride(path, "t", idx, orig, now);
        if (!r.ok) { el.textContent = before; flash(r.error || "Erreur"); return; }
        el.dataset.ovDone = now; el.textContent = now;
        ov.current.t = { ...(ov.current.t ?? {}), [String(idx)]: { o: orig, v: now } };
        flash("Texte enregistré.");
      };
      const key = (k: KeyboardEvent) => { if (k.key === "Enter") { k.preventDefault(); el.blur(); } if (k.key === "Escape") { cancelled = true; el.blur(); } };
      el.addEventListener("blur", done); el.addEventListener("keydown", key);
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("#sx-panel, #sx-toggle, dialog")) return;
      const m = t.closest<HTMLElement>("[data-ov='m']");
      if (m) { e.preventDefault(); e.stopPropagation(); const idx = mediaTargets().indexOf(m); if (idx >= 0) setPick({ el: m, idx }); return; }
      const link = t.closest("a, button");
      if (link && link.closest("[data-ov]")) e.preventDefault();
    };
    document.addEventListener("dblclick", onDbl, true);
    document.addEventListener("click", onClick, true);
    return () => {
      clearInterval(iv);
      document.removeEventListener("dblclick", onDbl, true);
      document.removeEventListener("click", onClick, true);
      document.querySelectorAll("[data-ov]").forEach((e) => e.removeAttribute("data-ov"));
    };
  }, [path]);

  async function choose(url: string) {
    if (!pick) return;
    const { el, idx } = pick;
    setPick(null);
    const orig = el.dataset.ovOrig ?? ov.current.m?.[String(idx)]?.o ?? mediaSrc(el);
    const r = await saveOverride(path, "m", idx, orig, url);
    if (!r.ok) return flash(r.error || "Erreur");
    el.dataset.ovOrig = orig; el.dataset.ovDone = url;
    el.setAttribute("src", url); el.removeAttribute("srcset"); el.removeAttribute("sizes");
    if (el instanceof HTMLVideoElement) el.load();
    ov.current.m = { ...(ov.current.m ?? {}), [String(idx)]: { o: orig, v: url } };
    flash("Image enregistrée.");
  }

  return (
    <>
      <p className="muted mb-3 text-[0.8rem]">Sur la page : <strong>double-clic</strong> sur un texte pour le réécrire (Entrée pour valider, Échap pour annuler) ; <strong>clic</strong> sur une image ou une vidéo pour la remplacer.</p>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <button type="button" className="muted text-sm underline" onClick={async () => { if (!confirm("Retirer tous les textes et images modifiés directement sur cette page ?")) return; await resetOverrides(path); location.reload(); }}>Annuler mes modifications de textes et d&apos;images</button>
        {msg && <span role="status" className="acc text-sm">{msg}</span>}
      </div>
      {pick && <MediaPicker open onClose={() => setPick(null)} onPick={(m) => choose(m.url)} />}
    </>
  );
}

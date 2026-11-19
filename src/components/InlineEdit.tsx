"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { applyOverrides, buildAdded, hideBox, mediaSrc, mediaTargets, setMediaSrc, textTargets, type OvAdd, type PageOverrides } from "@/lib/overrides";
import { resetOverrides, savePageOverrides } from "@/app/admin/section-actions";

const MediaPicker = dynamic(() => import("./admin/MediaPicker").then((m) => m.MediaPicker), { ssr: false });

type Sel =
  | { kind: "t"; el: HTMLElement; idx: number }
  | { kind: "m"; el: HTMLElement; idx: number }
  | { kind: "g"; el: HTMLElement; id: string };
type Pick = { mode: "replace" | "add" | "convert" | "gen"; sel: Sel };

const uid = () => Math.random().toString(36).slice(2, 10);
const clone = (v: PageOverrides | undefined): PageOverrides => JSON.parse(JSON.stringify(v ?? {}));

/**
 * Édition directe sur la page, comme dans l'inspecteur du navigateur :
 * clic sur un texte, une image ou une vidéo → barre d'outils (modifier, remplacer, supprimer, transformer, ajouter une zone).
 * Double-clic sur un texte : réécriture immédiate. Tout est enregistré dans la même donnée que l'admin « Apparence des pages ».
 */
export function InlineEdit({ path, local }: { path: string; local: PageOverrides | undefined }) {
  const [sel, setSel] = useState<Sel | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [msg, setMsg] = useState("");
  const [, force] = useState(0);
  const ov = useRef<PageOverrides>(clone(local));
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };

  /** Enregistre l'état complet de la page, puis le réapplique sur la page. */
  const commit = async (next: PageOverrides, ok: string) => {
    const prev = ov.current;
    ov.current = next;
    const r = await savePageOverrides(path, next);
    if (!r.ok) { ov.current = prev; flash(r.error || "Erreur"); return false; }
    flash(ok);
    return true;
  };

  // repères visuels + écoute des clics
  useEffect(() => {
    const mark = () => {
      textTargets().forEach((e) => e.setAttribute("data-ov", "t"));
      mediaTargets().forEach((e) => e.setAttribute("data-ov", "m"));
      document.querySelectorAll<HTMLElement>("[data-ov-gen]").forEach((e) => e.setAttribute("data-ov", "g"));
    };
    mark();
    const iv = setInterval(mark, 1500);

    const selectFrom = (t: HTMLElement): Sel | null => {
      const g = t.closest<HTMLElement>("[data-ov-gen]");
      if (g) return { kind: "g", el: g, id: g.dataset.ovGen! };
      const m = t.closest<HTMLElement>("[data-ov='m']");
      if (m) { const idx = mediaTargets().indexOf(m); return idx >= 0 ? { kind: "m", el: m, idx } : null; }
      const x = t.closest<HTMLElement>("[data-ov='t']");
      if (x) { const idx = textTargets().indexOf(x); return idx >= 0 ? { kind: "t", el: x, idx } : null; }
      return null;
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("#sx-panel, #sx-toggle, #sx-bar, dialog, .slot")) return;
      if (t.isContentEditable) return;
      const s = selectFrom(t);
      if (s) { e.preventDefault(); setSel(s); return; }
      if (t.closest("a, button")?.closest("[data-ov]")) e.preventDefault();
      setSel(null);
    };
    const onDbl = (e: MouseEvent) => {
      const s = selectFrom(e.target as HTMLElement);
      if (!s || s.kind === "m" || (s.kind === "g" && /IMG|VIDEO/.test(s.el.tagName))) return;
      e.preventDefault(); e.stopPropagation();
      editText(s);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDbl, true);
    const onScroll = () => force((n) => n + 1);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearInterval(iv);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDbl, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.querySelectorAll("[data-ov]").forEach((e) => e.removeAttribute("data-ov"));
      document.querySelectorAll(".sx-picked").forEach((e) => e.classList.remove("sx-picked"));
    };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.querySelectorAll(".sx-picked").forEach((e) => e.classList.remove("sx-picked"));
    sel?.el.classList.add("sx-picked");
  }, [sel]);

  const origText = (el: HTMLElement) => el.dataset.ovText ?? (el.textContent || "").trim();
  const anchorKey = (s: Sel) => (s.kind === "t" ? `t:${s.idx}` : s.kind === "m" ? `m:${s.idx}` : "");
  const anchorOrig = (s: Sel) => (s.kind === "t" ? origText(s.el) : mediaSrc(s.el));
  const addOf = (id: string) => ov.current.a?.find((a) => a.id === id);

  /** Réécriture d'un texte (d'origine ou ajouté) directement dans la page. */
  function editText(s: Sel) {
    const el = s.el;
    if (el.isContentEditable) return;
    const before = (el.textContent || "").trim();
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
      if (cancelled || now === before || !/\p{L}/u.test(now)) { el.textContent = before; if (!cancelled && now !== before) flash("Le texte ne peut pas être vide : utilisez « Supprimer »."); return; }
      const next = clone(ov.current);
      if (s.kind === "g") {
        next.a = (next.a ?? []).map((a) => (a.id === s.id ? { ...a, v: now } : a));
      } else if (s.kind === "t") {
        const o = origText(el);
        el.dataset.ovText = o;
        next.t = { ...(next.t ?? {}) };
        if (now === o) delete next.t[String(s.idx)]; else next.t[String(s.idx)] = { o, v: now };
      }
      if (!(await commit(next, "Texte enregistré."))) el.textContent = before;
    };
    const key = (k: KeyboardEvent) => { if (k.key === "Enter" && !k.shiftKey) { k.preventDefault(); el.blur(); } if (k.key === "Escape") { cancelled = true; el.blur(); } };
    el.addEventListener("blur", done); el.addEventListener("keydown", key);
  }

  /** Supprime un élément : une zone ajoutée disparaît, un élément d'origine est masqué (restaurable). */
  async function remove(s: Sel) {
    const next = clone(ov.current);
    if (s.kind === "g") {
      next.a = (next.a ?? []).filter((a) => a.id !== s.id);
      if (await commit(next, "Zone supprimée.")) s.el.remove();
    } else {
      const key = anchorKey(s);
      next.x = { ...(next.x ?? {}), [key]: { o: anchorOrig(s) } };
      if (await commit(next, "Élément supprimé (restaurable depuis l'admin ou « Tout restaurer »).")) hideBox(s.el).setAttribute("data-ov-hidden", key);
    }
    setSel(null);
  }

  /** Ajoute une zone (texte ou image) juste après l'élément ; « remplace » = l'élément d'origine est masqué. */
  async function addAfter(s: Sel, k: "img" | "text", v: string, replace = false) {
    let at = anchorKey(s), o = anchorOrig(s);
    if (s.kind === "g") { const g = addOf(s.id); if (!g) return; at = g.at; o = g.o; }
    const item: OvAdd = { id: uid(), at, o, k, v };
    const next = clone(ov.current);
    const list = [...(next.a ?? [])];
    // position : juste après l'élément (avant les zones déjà ajoutées à cet endroit), ou juste après la zone ajoutée choisie
    const first = list.findIndex((x) => x.at === at);
    const pos = s.kind === "g" ? list.findIndex((x) => x.id === s.id) + 1 : first >= 0 ? first : list.length;
    list.splice(pos, 0, item);
    next.a = list;
    if (replace && s.kind !== "g") next.x = { ...(next.x ?? {}), [at]: { o } };
    if (replace && s.kind === "g") next.a = next.a.filter((a) => a.id !== s.id);
    if (!(await commit(next, replace ? "Élément transformé." : "Zone ajoutée."))) return;
    if (replace && s.kind === "g") s.el.remove();
    if (replace && s.kind !== "g") hideBox(s.el).setAttribute("data-ov-hidden", at);
    applyOverrides(ov.current);
    const el = document.querySelector<HTMLElement>(`[data-ov-gen="${item.id}"]`);
    if (el) { el.setAttribute("data-ov", "g"); const ns: Sel = { kind: "g", el, id: item.id }; setSel(ns); if (k === "text") setTimeout(() => editText(ns), 60); }
  }

  async function restoreOne(key: string) {
    const next = clone(ov.current);
    if (next.x) { delete next.x[key]; if (!Object.keys(next.x).length) delete next.x; }
    if (await commit(next, "Élément restauré.")) document.querySelectorAll(`[data-ov-hidden="${key}"]`).forEach((e) => e.removeAttribute("data-ov-hidden"));
    setSel(null);
  }

  async function restoreAll() {
    if (!ov.current.x) return;
    const next = clone(ov.current);
    delete next.x;
    if (await commit(next, "Éléments supprimés restaurés.")) document.querySelectorAll("[data-ov-hidden]").forEach((e) => e.removeAttribute("data-ov-hidden"));
  }

  async function chosen(url: string) {
    const p = pick;
    setPick(null);
    if (!p) return;
    const s = p.sel;
    if (p.mode === "add") return addAfter(s, "img", url);
    if (p.mode === "convert") return addAfter(s, "img", url, true);
    const next = clone(ov.current);
    if (s.kind === "g") {
      next.a = (next.a ?? []).map((a) => (a.id === s.id ? { ...a, v: url } : a));
      if (await commit(next, "Image enregistrée.")) { const a = next.a.find((x) => x.id === s.id)!; const el = buildAdded(a); el.setAttribute("data-ov", "g"); s.el.replaceWith(el); setSel({ kind: "g", el, id: s.id }); }
      return;
    }
    if (s.kind !== "m") return;
    const o = mediaSrc(s.el);
    next.m = { ...(next.m ?? {}), [String(s.idx)]: { o, v: url } };
    if (await commit(next, "Image enregistrée.")) setMediaSrc(s.el, url);
  }

  // barre d'outils flottante au-dessus de l'élément choisi
  const bar = (() => {
    if (!sel || !document.contains(sel.el)) return null;
    const r = sel.el.getBoundingClientRect();
    const top = Math.max(8, r.top - 46), left = Math.min(Math.max(8, r.left), window.innerWidth - 470);
    const isMedia = sel.kind === "m" || (sel.kind === "g" && /IMG|VIDEO/.test(sel.el.tagName));
    const B = ({ on, children, danger }: { on: () => void; children: React.ReactNode; danger?: boolean }) => (
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} className={danger ? "sx-bar-del" : ""}>{children}</button>
    );
    return (
      <div id="sx-bar" role="toolbar" aria-label="Modifier l'élément" style={{ top, left }}>
        <span className="sx-bar-tag">{isMedia ? "Image" : sel.kind === "g" ? "Texte ajouté" : "Texte"}</span>
        {isMedia ? <B on={() => setPick({ mode: sel.kind === "g" ? "gen" : "replace", sel })}>Remplacer</B> : <B on={() => editText(sel)}>Modifier</B>}
        {isMedia
          ? <B on={() => addAfter(sel, "text", "Nouveau texte", true)}>En texte</B>
          : <B on={() => setPick({ mode: "convert", sel })}>En image</B>}
        <B on={() => setPick({ mode: "add", sel })}>+ Image</B>
        <B on={() => addAfter(sel, "text", "Nouveau texte")}>+ Texte</B>
        {sel.kind !== "g" && hideBox(sel.el).hasAttribute("data-ov-hidden")
          ? <B on={() => restoreOne(anchorKey(sel))}>Restaurer</B>
          : <B on={() => remove(sel)} danger>Supprimer</B>}
        <B on={() => setSel(null)}>✕</B>
      </div>
    );
  })();

  const hidden = Object.keys(ov.current.x ?? {}).length;
  const added = (ov.current.a ?? []).length;
  return (
    <>
      <p className="muted mb-3 text-[0.8rem]">Sur la page : <strong>cliquez</strong> sur un texte, une image ou une vidéo pour le modifier, le remplacer, le supprimer, le transformer (texte ↔ image) ou ajouter une zone juste après. <strong>Double-clic</strong> sur un texte : réécriture directe (Entrée pour valider, Échap pour annuler).</p>
      <p className="muted mb-3 text-[0.78rem]">{added} zone(s) ajoutée(s) · {hidden} élément(s) supprimé(s). Mêmes réglages dans l&apos;admin › Apparence des pages.</p>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        {hidden > 0 && <button type="button" className="text-sm underline" onClick={restoreAll}>Tout restaurer</button>}
        <button type="button" className="muted text-sm underline" onClick={async () => { if (!confirm("Retirer toutes les modifications directes de cette page (textes, images, zones ajoutées, suppressions) ?")) return; await resetOverrides(path); location.reload(); }}>Annuler toutes mes modifications</button>
        {msg && <span role="status" className="acc text-sm">{msg}</span>}
      </div>
      {bar}
      {pick && (
        <MediaPicker
          open
          onClose={() => setPick(null)}
          onPick={(m) => chosen(m.url)}
          onRemove={pick.mode === "replace" || pick.mode === "gen" ? () => { const s = pick.sel; setPick(null); remove(s); } : undefined}
          removeLabel="Supprimer cette image"
        />
      )}
    </>
  );
}

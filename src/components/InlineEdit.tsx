"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FONTS, applyElStyle, applyOverrides, buildAdded, buildFree, currentLists, hideBox, iconSig, iconTargets, mediaSrc, mediaTargets, placeFree, setMediaSrc, textTargets,
  type ElStyle, type OvAdd, type OvFree, type PageOverrides,
} from "@/lib/overrides";
import { listSections } from "./sectionDom";
import { resetOverrides, savePageOverrides } from "@/app/admin/section-actions";

const MediaPicker = dynamic(() => import("./admin/MediaPicker").then((m) => m.MediaPicker), { ssr: false });

type Kind = "t" | "m" | "i" | "g" | "f";
type Tgt = { kind: Kind; el: HTMLElement; idx?: number; id?: string };
type PickMode = "replace" | "add" | "convert" | "free";

const uid = () => Math.random().toString(36).slice(2, 10);
const clone = (v: PageOverrides | undefined): PageOverrides => JSON.parse(JSON.stringify(v ?? {}));
const keyOf = (t: Tgt) => (t.kind === "g" || t.kind === "f" ? `${t.kind}:${t.id}` : `${t.kind}:${t.idx}`);
const anchorKey = (t: Tgt) => `${t.kind}:${t.idx}`;
const isMediaEl = (el: HTMLElement) => /^(IMG|VIDEO)$/.test(el.tagName);
const isTextual = (t: Tgt) => t.kind === "t" || ((t.kind === "g" || t.kind === "f") && !isMediaEl(t.el));
/** Éléments qu'on agrandit par échelle (icônes, boutons, liens) plutôt que par largeur. */
const usesScale = (t: Tgt) => t.kind === "i" || (t.kind === "t" && /^(A|BUTTON)$/.test(t.el.tagName));
const sections = () => listSections().map((s) => s.el);
const MARK = "#sx-panel, #sx-toggle, #sx-bar, #sx-handle, dialog, .sx-skip";

/**
 * Édition directe sur la page, comme dans un traitement de texte :
 * clic = sélection (Maj+clic ou Maj+glisser pour plusieurs), glisser = déplacer, poignée = agrandir, double-clic = écrire,
 * panneau = police, taille, gras / italique / souligné, alignement, couleur, largeur ; zones de texte et d'image libres.
 * Tout est enregistré dans la même donnée que l'admin « Apparence des pages ».
 */
export function InlineEdit({ path, local }: { path: string; local: PageOverrides | undefined }) {
  const [sel, setSel] = useState<Tgt[]>([]);
  const [pick, setPick] = useState<{ mode: PickMode } | null>(null);
  const [msg, setMsg] = useState("");
  const [, force] = useState(0);
  const ov = useRef<PageOverrides>(clone(local));
  const selRef = useRef<Tgt[]>([]);
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burst = useRef(false);
  const suppress = useRef(0);
  const typing = useRef(false);
  selRef.current = sel;
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };
  const rerender = () => force((n) => n + 1);

  /* ------------------------------------------------------------ enregistrement */
  const persist = async (ok = "Enregistré.") => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    burst.current = false;
    const r = await savePageOverrides(path, ov.current);
    flash(r.ok ? ok : r.error || "Erreur d'enregistrement");
    return r.ok;
  };
  /** Modifie l'état de la page ; l'enregistrement est groupé (une série de réglages = une seule sauvegarde et une seule étape d'annulation). */
  const mutate = (fn: (d: PageOverrides) => void, now = false, ok?: string) => {
    if (!burst.current) { past.current.push(JSON.stringify(ov.current)); if (past.current.length > 60) past.current.shift(); future.current = []; burst.current = true; }
    const d = clone(ov.current);
    fn(d);
    ov.current = d;
    if (timer.current) clearTimeout(timer.current);
    if (now) return persist(ok);
    timer.current = setTimeout(() => persist(), 700);
  };
  const undo = async (redo = false) => {
    const from = redo ? future.current : past.current;
    const prev = from.pop();
    if (prev === undefined) return flash(redo ? "Rien à rétablir." : "Rien à annuler.");
    (redo ? past.current : future.current).push(JSON.stringify(ov.current));
    ov.current = JSON.parse(prev);
    if (await persist()) location.href = `${path}?edit=1`;
  };

  /* ------------------------------------------------------------ cibles */
  const targetFrom = (node: HTMLElement): Tgt | null => {
    const svg = node.closest<HTMLElement>("svg[data-ov='i']");
    if (svg) { const idx = iconTargets().indexOf(svg); if (idx >= 0) return { kind: "i", el: svg, idx }; }
    const g = node.closest<HTMLElement>("[data-ov-gen]");
    if (g) return { kind: g.dataset.ovFree ? "f" : "g", el: g, id: g.dataset.ovGen };
    const m = node.closest<HTMLElement>("[data-ov='m']");
    if (m) { const idx = mediaTargets().indexOf(m); if (idx >= 0) return { kind: "m", el: m, idx }; }
    const x = node.closest<HTMLElement>("[data-ov='t']");
    if (x) { const idx = textTargets().indexOf(x); if (idx >= 0) return { kind: "t", el: x, idx }; }
    return null;
  };
  const sigOf = (t: Tgt) => (t.kind === "t" ? t.el.dataset.ovText ?? (t.el.textContent || "").trim() : t.kind === "m" ? mediaSrc(t.el) : iconSig(t.el));
  const allTargets = (): Tgt[] => {
    const l = currentLists();
    return [
      ...l.t.map((el, idx): Tgt => ({ kind: "t", el, idx })),
      ...l.m.map((el, idx): Tgt => ({ kind: "m", el, idx })),
      ...l.i.map((el, idx): Tgt => ({ kind: "i", el, idx })),
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-ov-gen]")).map((el): Tgt => ({ kind: el.dataset.ovFree ? "f" : "g", el, id: el.dataset.ovGen })),
    ].filter((t) => !t.el.closest("[data-ov-hidden]"));
  };
  const addOf = (id?: string) => ov.current.a?.find((a) => a.id === id);
  const freeOf = (id?: string) => ov.current.f?.find((f) => f.id === id);
  const getStyle = (t: Tgt): ElStyle => (t.kind === "g" ? addOf(t.id)?.st : t.kind === "f" ? freeOf(t.id)?.st : ov.current.s?.[keyOf(t)]?.st) ?? {};
  const setStyleIn = (d: PageOverrides, t: Tgt, st: ElStyle) => {
    const empty = !Object.keys(st).length;
    if (t.kind === "g") { const a = d.a?.find((x) => x.id === t.id); if (a) { if (empty) delete a.st; else a.st = st; } }
    else if (t.kind === "f") { const f = d.f?.find((x) => x.id === t.id); if (f) { if (empty) delete f.st; else f.st = st; } }
    else if (empty) { if (d.s) { delete d.s[keyOf(t)]; if (!Object.keys(d.s).length) delete d.s; } }
    else { d.s = { ...(d.s ?? {}), [keyOf(t)]: { o: sigOf(t), st } }; }
  };
  const clean = (st: ElStyle): ElStyle => { const o: Record<string, unknown> = {}; for (const [k, v] of Object.entries(st)) if (v !== undefined && v !== null && v !== "" && v !== 0 && !(k === "sc" && v === 100)) o[k] = v; return o as ElStyle; };

  /** Applique un réglage de mise en forme à toute la sélection : aperçu immédiat, enregistrement groupé. */
  const restyle = (patch: (s: ElStyle, t: Tgt) => ElStyle, now = false) => {
    const targets = selRef.current;
    if (!targets.length) return;
    const results = targets.map((t) => ({ t, st: clean(patch({ ...getStyle(t) }, t)) }));
    results.forEach(({ t, st }) => applyElStyle(t.el, st, { free: t.kind === "f" }));
    mutate((d) => results.forEach(({ t, st }) => setStyleIn(d, t, st)), now);
    rerender();
  };

  /* ------------------------------------------------------------ repères + écoute */
  useEffect(() => {
    const mark = () => {
      textTargets().forEach((e) => e.setAttribute("data-ov", "t"));
      mediaTargets().forEach((e) => e.setAttribute("data-ov", "m"));
      iconTargets().forEach((e) => e.setAttribute("data-ov", "i"));
      document.querySelectorAll<HTMLElement>("[data-ov-gen]").forEach((e) => e.setAttribute("data-ov", "g"));
    };
    mark();
    const iv = setInterval(mark, 1500);

    const select = (list: Tgt[]) => { selRef.current = list; setSel(list); };
    const toggle = (t: Tgt) => { const cur = selRef.current; select(cur.some((x) => x.el === t.el) ? cur.filter((x) => x.el !== t.el) : [...cur, t]); };

    const onClick = (e: MouseEvent) => {
      const n = e.target as HTMLElement;
      if (n.closest(MARK) || n.isContentEditable || n.closest(".slot")) return;
      if (Date.now() < suppress.current) { e.preventDefault(); e.stopPropagation(); return; }
      const t = targetFrom(n);
      if (t) { e.preventDefault(); if (e.shiftKey || e.ctrlKey || e.metaKey) toggle(t); else select([t]); return; }
      if (n.closest("a, button")?.closest("[data-ov]")) e.preventDefault();
      select([]);
    };
    const onDbl = (e: MouseEvent) => {
      const t = targetFrom(e.target as HTMLElement);
      if (!t || !isTextual(t)) return;
      e.preventDefault(); e.stopPropagation();
      select([t]);
      editText(t);
    };

    /* glisser : déplacer toute la sélection ; Maj + glisser dans le vide : sélection par zone */
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const n = e.target as HTMLElement;
      if (n.closest(MARK) || n.isContentEditable || n.closest(".slot") || typing.current) return;
      const lead = targetFrom(n);
      if (!lead) {
        if (!e.shiftKey || !n.closest("#contenu, footer")) return;
        const x0 = e.clientX, y0 = e.clientY;
        const box = document.createElement("div"); box.id = "sx-marquee"; document.body.appendChild(box);
        const mv = (m: PointerEvent) => { Object.assign(box.style, { left: `${Math.min(x0, m.clientX)}px`, top: `${Math.min(y0, m.clientY)}px`, width: `${Math.abs(m.clientX - x0)}px`, height: `${Math.abs(m.clientY - y0)}px` }); };
        const up = (m: PointerEvent) => {
          window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); box.remove();
          const L = Math.min(x0, m.clientX), R = Math.max(x0, m.clientX), T = Math.min(y0, m.clientY), B = Math.max(y0, m.clientY);
          if (R - L < 6 && B - T < 6) return;
          suppress.current = Date.now() + 250;
          select(allTargets().filter((t) => { const r = t.el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.left < R && r.right > L && r.top < B && r.bottom > T; }));
        };
        window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
        return;
      }
      const x0 = e.clientX, y0 = e.clientY;
      let started = false;
      let items: { t: Tgt; x: number; y: number }[] = [];
      const begin = () => {
        let cur = selRef.current;
        if (!cur.some((x) => x.el === lead.el)) { cur = e.shiftKey ? [...cur, lead] : [lead]; select(cur); }
        items = cur.map((t) => {
          if (t.kind === "f") { const f = freeOf(t.id); return { t, x: f?.x ?? 0, y: f?.y ?? 0 }; }
          const s = getStyle(t); return { t, x: s.x ?? 0, y: s.y ?? 0 };
        });
        started = true;
        document.body.classList.add("sx-dragging");
      };
      const mv = (m: PointerEvent) => {
        const dx = m.clientX - x0, dy = m.clientY - y0;
        if (!started) { if (Math.hypot(dx, dy) < 6) return; begin(); }
        m.preventDefault();
        for (const it of items) {
          if (it.t.kind === "f") {
            const w = it.t.el.parentElement?.getBoundingClientRect().width || 1;
            placeFree(it.t.el, { x: it.x + (dx / w) * 100, y: it.y + dy });
          } else {
            applyElStyle(it.t.el, { ...getStyle(it.t), x: it.x + dx, y: it.y + dy });
          }
        }
        rerender();
      };
      const up = (m: PointerEvent) => {
        window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up);
        document.body.classList.remove("sx-dragging");
        if (!started) return;
        suppress.current = Date.now() + 250;
        const dx = m.clientX - x0, dy = m.clientY - y0;
        mutate((d) => {
          for (const it of items) {
            if (it.t.kind === "f") {
              const f = d.f?.find((x) => x.id === it.t.id); const w = it.t.el.parentElement?.getBoundingClientRect().width || 1;
              if (f) { f.x = Math.round((it.x + (dx / w) * 100) * 100) / 100; f.y = Math.round(it.y + dy); }
            } else setStyleIn(d, it.t, clean({ ...getStyle(it.t), x: Math.round(it.x + dx), y: Math.round(it.y + dy) }));
          }
        }, true, "Position enregistrée.");
        rerender();
      };
      window.addEventListener("pointermove", mv, { passive: false }); window.addEventListener("pointerup", up);
    };

    /* clavier : flèches = déplacer, Suppr = supprimer, Ctrl+Z / Ctrl+Y = annuler / rétablir, Échap = désélectionner */
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (typing.current || a?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName || "")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); undo(e.shiftKey); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); undo(true); return; }
      if (!selRef.current.length) return;
      if (e.key === "Escape") { select([]); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeSel(); return; }
      const step = e.shiftKey ? 10 : 1;
      const d = e.key === "ArrowLeft" ? [-step, 0] : e.key === "ArrowRight" ? [step, 0] : e.key === "ArrowUp" ? [0, -step] : e.key === "ArrowDown" ? [0, step] : null;
      if (!d) return;
      e.preventDefault();
      nudge(d[0], d[1]);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDbl, true);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    const onScroll = () => force((n) => n + 1);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearInterval(iv);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDbl, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.querySelectorAll("[data-ov]").forEach((e) => e.removeAttribute("data-ov"));
      document.querySelectorAll(".sx-picked").forEach((e) => e.classList.remove("sx-picked"));
    };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.querySelectorAll(".sx-picked").forEach((e) => e.classList.remove("sx-picked"));
    sel.forEach((t) => t.el.classList.add("sx-picked"));
  }, [sel]);

  /* ------------------------------------------------------------ actions */
  function nudge(dx: number, dy: number) {
    const targets = selRef.current;
    const results = targets.map((t) => {
      if (t.kind === "f") { const f = freeOf(t.id); const w = t.el.parentElement?.getBoundingClientRect().width || 1; return { t, fx: (f?.x ?? 0) + (dx / w) * 100, fy: (f?.y ?? 0) + dy, st: undefined as ElStyle | undefined }; }
      const s = getStyle(t);
      return { t, fx: 0, fy: 0, st: clean({ ...s, x: (s.x ?? 0) + dx, y: (s.y ?? 0) + dy }) as ElStyle | undefined };
    });
    results.forEach((r) => { if (r.st) applyElStyle(r.t.el, r.st); else placeFree(r.t.el, { x: r.fx, y: r.fy }); });
    mutate((d) => results.forEach((r) => {
      if (r.st) setStyleIn(d, r.t, r.st);
      else { const f = d.f?.find((x) => x.id === r.t.id); if (f) { f.x = Math.round(r.fx * 100) / 100; f.y = Math.round(r.fy); } }
    }));
    rerender();
  }

  /** Réécriture d'un texte (d'origine, ajouté ou libre) directement dans la page. */
  function editText(t: Tgt) {
    const el = t.el;
    if (el.isContentEditable) return;
    const before = (el.textContent || "").trim();
    typing.current = true;
    el.contentEditable = "plaintext-only";
    if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
    el.classList.add("sx-typing");
    el.focus();
    getSelection()?.selectAllChildren(el);
    let cancelled = false;
    const done = async () => {
      el.removeEventListener("blur", done); el.removeEventListener("keydown", key);
      el.removeAttribute("contenteditable"); el.classList.remove("sx-typing");
      typing.current = false;
      const now = (el.textContent || "").trim();
      if (cancelled || now === before || !/\p{L}/u.test(now)) { el.textContent = before; if (!cancelled && now !== before) flash("Le texte ne peut pas être vide : utilisez « Supprimer »."); return; }
      if (t.kind === "t") { const o = el.dataset.ovText ?? before; el.dataset.ovText = o; mutate((d) => { d.t = { ...(d.t ?? {}) }; if (now === o) delete d.t[String(t.idx)]; else d.t[String(t.idx)] = { o, v: now }; if (!Object.keys(d.t).length) delete d.t; }, true, "Texte enregistré."); }
      else if (t.kind === "g") mutate((d) => { const a = d.a?.find((x) => x.id === t.id); if (a) a.v = now; }, true, "Texte enregistré.");
      else mutate((d) => { const f = d.f?.find((x) => x.id === t.id); if (f) f.v = now; }, true, "Texte enregistré.");
    };
    const key = (k: KeyboardEvent) => { if (k.key === "Enter" && !k.shiftKey) { k.preventDefault(); el.blur(); } if (k.key === "Escape") { cancelled = true; el.blur(); } };
    el.addEventListener("blur", done); el.addEventListener("keydown", key);
  }

  /** Supprime : une zone ajoutée disparaît, un élément d'origine est masqué (restaurable). */
  function removeSel() {
    const targets = selRef.current;
    if (!targets.length) return;
    mutate((d) => {
      for (const t of targets) {
        if (t.kind === "g") d.a = (d.a ?? []).filter((a) => a.id !== t.id);
        else if (t.kind === "f") d.f = (d.f ?? []).filter((f) => f.id !== t.id);
        else d.x = { ...(d.x ?? {}), [anchorKey(t)]: { o: sigOf(t) } };
      }
      if (d.a && !d.a.length) delete d.a;
      if (d.f && !d.f.length) delete d.f;
    }, true, targets.length > 1 ? `${targets.length} éléments supprimés.` : "Élément supprimé.");
    for (const t of targets) { if (t.kind === "g" || t.kind === "f") t.el.remove(); else hideBox(t.el).setAttribute("data-ov-hidden", anchorKey(t)); }
    selRef.current = []; setSel([]);
  }

  /** Ajoute une zone (texte ou image) juste après l'élément ; `replace` = l'élément d'origine est masqué (transformation texte ↔ image). */
  async function addAfter(t: Tgt, k: "img" | "text", v: string, replace = false) {
    let at = anchorKey(t), o = t.kind === "g" ? "" : sigOf(t);
    if (t.kind === "g") { const g = addOf(t.id); if (!g) return; at = g.at; o = g.o; }
    const item: OvAdd = { id: uid(), at, o, k, v };
    mutate((d) => {
      const list = [...(d.a ?? [])];
      const first = list.findIndex((x) => x.at === at);
      const pos = t.kind === "g" ? list.findIndex((x) => x.id === t.id) + 1 : first >= 0 ? first : list.length;
      list.splice(pos, 0, item);
      d.a = list;
      if (replace && t.kind !== "g") d.x = { ...(d.x ?? {}), [at]: { o } };
      if (replace && t.kind === "g") d.a = d.a.filter((x) => x.id !== t.id);
    }, true, replace ? "Élément transformé." : "Zone ajoutée.");
    if (replace && t.kind === "g") t.el.remove();
    if (replace && t.kind !== "g") hideBox(t.el).setAttribute("data-ov-hidden", at);
    applyOverrides(ov.current, sections);
    const el = document.querySelector<HTMLElement>(`[data-ov-gen="${item.id}"]`);
    if (el) { el.setAttribute("data-ov", "g"); const nt: Tgt = { kind: "g", el, id: item.id }; selRef.current = [nt]; setSel([nt]); if (k === "text") setTimeout(() => editText(nt), 60); }
  }

  /** Zone libre : posée au centre de l'écran dans la section visible, puis déplaçable où l'on veut. */
  function addFree(k: "img" | "text", v: string) {
    const secs = sections();
    const mid = window.innerHeight / 2;
    let i = secs.findIndex((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    if (i < 0) i = secs.findIndex((s) => s.getBoundingClientRect().bottom > 0);
    if (i < 0) return flash("Aucune section à cet endroit.");
    const r = secs[i].getBoundingClientRect();
    const f: OvFree = { id: uid(), sec: i, k, v, x: 12, y: Math.max(12, Math.min(r.height - 60, mid - r.top - 20)), ...(k === "img" ? { st: { w: 320 } } : {}) };
    mutate((d) => { d.f = [...(d.f ?? []), f]; }, true, k === "text" ? "Zone de texte ajoutée : double-cliquez pour écrire, glissez pour la placer." : "Image ajoutée : glissez-la où vous voulez.");
    const el = buildFree(f, secs[i]);
    el.setAttribute("data-ov", "g");
    const nt: Tgt = { kind: "f", el, id: f.id };
    selRef.current = [nt]; setSel([nt]);
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    if (k === "text") setTimeout(() => editText(nt), 350);
  }

  function restoreOne(key: string) {
    mutate((d) => { if (d.x) { delete d.x[key]; if (!Object.keys(d.x).length) delete d.x; } }, true, "Élément restauré.");
    document.querySelectorAll(`[data-ov-hidden="${key}"]`).forEach((e) => e.removeAttribute("data-ov-hidden"));
    selRef.current = []; setSel([]);
  }
  function restoreAll() {
    mutate((d) => { delete d.x; }, true, "Éléments supprimés restaurés.");
    document.querySelectorAll("[data-ov-hidden]").forEach((e) => e.removeAttribute("data-ov-hidden"));
  }

  function chosen(url: string) {
    const p = pick, t = sel[0];
    setPick(null);
    if (!p) return;
    if (p.mode === "free") return addFree("img", url);
    if (!t) return;
    if (p.mode === "add") return addAfter(t, "img", url);
    if (p.mode === "convert") return addAfter(t, "img", url, true);
    if (t.kind === "g") {
      mutate((d) => { const a = d.a?.find((x) => x.id === t.id); if (a) a.v = url; }, true, "Image enregistrée.");
      const a = addOf(t.id)!; const el = buildAdded({ ...a, v: url }); el.setAttribute("data-ov", "g"); t.el.replaceWith(el); const nt: Tgt = { kind: "g", el, id: t.id }; selRef.current = [nt]; setSel([nt]);
    } else if (t.kind === "f") {
      mutate((d) => { const f = d.f?.find((x) => x.id === t.id); if (f) f.v = url; }, true, "Image enregistrée.");
      const f = freeOf(t.id)!; const sec = t.el.parentElement as HTMLElement; const el = buildFree({ ...f, v: url }, sec); el.setAttribute("data-ov", "g"); t.el.replaceWith(el); const nt: Tgt = { kind: "f", el, id: t.id }; selRef.current = [nt]; setSel([nt]);
    } else if (t.kind === "m") {
      const o = mediaSrc(t.el);
      mutate((d) => { d.m = { ...(d.m ?? {}), [String(t.idx)]: { o, v: url } }; }, true, "Image enregistrée.");
      setMediaSrc(t.el, url);
    }
  }

  /* ------------------------------------------------------------ poignée d'agrandissement */
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const t = sel[0];
    if (!t) return;
    const startRect = t.el.getBoundingClientRect();
    const st0 = getStyle(t);
    const scale0 = st0.sc ?? 100;
    const x0 = e.clientX;
    typing.current = true; // empêche le glisser-déplacer pendant l'agrandissement
    const compute = (clientX: number): ElStyle => {
      const vis = Math.max(24, startRect.width + (clientX - x0));
      return clean(usesScale(t) ? { ...st0, sc: Math.round(Math.min(600, Math.max(20, scale0 * (vis / startRect.width)))) } : { ...st0, w: Math.round(vis / (scale0 / 100)) });
    };
    const mv = (m: PointerEvent) => { applyElStyle(t.el, compute(m.clientX), { free: t.kind === "f" }); rerender(); };
    const up = (m: PointerEvent) => {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up);
      typing.current = false;
      suppress.current = Date.now() + 250;
      const c = compute(m.clientX);
      mutate((d) => setStyleIn(d, t, c), true, "Taille enregistrée.");
    };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  };

  /* ------------------------------------------------------------ interface */
  const one = sel[0];
  const rect = one && document.contains(one.el) ? one.el.getBoundingClientRect() : null;
  const st = one ? getStyle(one) : {};
  const textual = sel.some(isTextual);
  const scaled = sel.length > 0 && sel.every(usesScale);
  const curSize = one && isTextual(one) ? Math.round(parseFloat(getComputedStyle(one.el).fontSize) || 16) : 16;
  const curWidth = one && rect ? Math.round(rect.width / ((st.sc ?? 100) / 100)) : 300;

  const B = ({ on, children, danger, title }: { on: () => void; children: React.ReactNode; danger?: boolean; title?: string }) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={on} className={danger ? "sx-bar-del" : ""}>{children}</button>
  );
  const bar = (() => {
    if (!rect || !one) return null;
    const top = rect.top > 56 ? rect.top - 48 : Math.min(window.innerHeight - 52, rect.bottom + 8);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - 480);
    const multi = sel.length > 1;
    const anchored = !multi && (one.kind === "t" || one.kind === "m" || one.kind === "g");
    const hiddenSel = !multi && one.kind !== "g" && one.kind !== "f" && hideBox(one.el).hasAttribute("data-ov-hidden");
    const label = multi ? `${sel.length} éléments` : one.kind === "i" ? "Icône" : isMediaEl(one.el) ? "Image" : one.kind === "f" ? "Zone libre" : one.kind === "g" ? "Texte ajouté" : /^(A|BUTTON)$/.test(one.el.tagName) ? "Bouton / lien" : "Texte";
    return (
      <div id="sx-bar" role="toolbar" aria-label="Modifier la sélection" style={{ top, left }}>
        <span className="sx-bar-tag">{label}</span>
        {!multi && isTextual(one) && <B on={() => editText(one)}>Modifier</B>}
        {!multi && isMediaEl(one.el) && <B on={() => setPick({ mode: "replace" })}>Remplacer</B>}
        {anchored && (isMediaEl(one.el) ? <B on={() => addAfter(one, "text", "Nouveau texte", true)}>En texte</B> : <B on={() => setPick({ mode: "convert" })}>En image</B>)}
        {anchored && <B on={() => setPick({ mode: "add" })}>+ Image</B>}
        {anchored && <B on={() => addAfter(one, "text", "Nouveau texte")}>+ Texte</B>}
        {hiddenSel ? <B on={() => restoreOne(anchorKey(one))}>Restaurer</B> : <B on={removeSel} danger>Supprimer</B>}
        <B on={() => { selRef.current = []; setSel([]); }} title="Désélectionner">✕</B>
      </div>
    );
  })();

  const hidden = Object.keys(ov.current.x ?? {}).length;
  const added = (ov.current.a ?? []).length + (ov.current.f ?? []).length;
  const Seg = ({ on, active, children, title }: { on: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button type="button" title={title} aria-label={title} aria-pressed={!!active} onClick={on} className={`sx-seg ${active ? "is-on" : ""}`}>{children}</button>
  );
  return (
    <>
      <p className="muted mb-3 text-[0.8rem]"><strong>Cliquez</strong> un texte, une image, une icône ou un bouton pour le choisir (<strong>Maj + clic</strong> ou <strong>Maj + glisser</strong> pour en prendre plusieurs). <strong>Glissez</strong> pour le déplacer, tirez la <strong>poignée</strong> pour l&apos;agrandir, <strong>double-clic</strong> pour écrire. Flèches : déplacer au pixel · Suppr : supprimer · Ctrl+Z : annuler.</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => addFree("text", "Votre texte ici")}>+ Zone de texte</button>
        <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => setPick({ mode: "free" })}>+ Image</button>
        <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 !py-2 text-sm" title="Annuler (Ctrl+Z)" onClick={() => undo()}>↶</button>
        <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 !py-2 text-sm" title="Rétablir (Ctrl+Y)" onClick={() => undo(true)}>↷</button>
      </div>

      {sel.length > 0 && (
        <fieldset className="sx-format mb-3 rounded-xl border p-3" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))" }}>
          <legend className="px-2 text-[0.8rem] font-semibold">Mise en forme · {sel.length > 1 ? `${sel.length} éléments` : "1 élément"}</legend>
          {textual && (
            <>
              <label className="mb-2 block text-[0.8rem]"><span className="muted mb-1 block">Police</span>
                <select className="field !py-2" value={st.ff ?? ""} onChange={(e) => restyle((s) => ({ ...s, ff: e.target.value || undefined }), true)}>
                  <option value="">Police d&apos;origine</option>
                  {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[0.8rem]">
                <span className="muted">Taille</span>
                <Seg title="Réduire" on={() => restyle((s) => ({ ...s, fs: Math.max(8, (s.fs ?? curSize) - 2) }))}>A−</Seg>
                <input aria-label="Taille du texte en pixels" type="number" min={8} max={240} value={st.fs ?? curSize} onChange={(e) => restyle((s) => ({ ...s, fs: Number(e.target.value) || undefined }))} className="field !w-[72px] !py-1.5 text-center" />
                <Seg title="Agrandir" on={() => restyle((s) => ({ ...s, fs: Math.min(240, (s.fs ?? curSize) + 2) }))}>A+</Seg>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Seg title="Gras" active={!!st.b} on={() => restyle((s) => ({ ...s, b: s.b ? undefined : 1 }), true)}><b>G</b></Seg>
                <Seg title="Italique" active={!!st.i} on={() => restyle((s) => ({ ...s, i: s.i ? undefined : 1 }), true)}><i>I</i></Seg>
                <Seg title="Souligné" active={!!st.u} on={() => restyle((s) => ({ ...s, u: s.u ? undefined : 1 }), true)}><u>S</u></Seg>
                <span className="mx-1 opacity-30">|</span>
                {([["left", "Aligner à gauche", "⇤"], ["center", "Centrer", "↔"], ["right", "Aligner à droite", "⇥"], ["justify", "Justifier", "☰"]] as const).map(([k, title, g]) => (
                  <Seg key={k} title={title} active={st.ta === k} on={() => restyle((s) => ({ ...s, ta: s.ta === k ? undefined : k }), true)}>{g}</Seg>
                ))}
                <input aria-label="Couleur du texte" type="color" value={st.c ?? "#1c1c1c"} onChange={(e) => restyle((s) => ({ ...s, c: e.target.value }))} className="ml-1 h-8 w-10 rounded border-0 bg-transparent" />
                {st.c && <button type="button" className="muted text-xs underline" onClick={() => restyle((s) => ({ ...s, c: undefined }), true)}>couleur d&apos;origine</button>}
              </div>
            </>
          )}
          {scaled ? (
            <label className="mb-2 block text-[0.8rem]"><span className="muted mb-1 block">Taille : {st.sc ?? 100} %</span>
              <input type="range" min={30} max={400} step={5} value={st.sc ?? 100} onChange={(e) => restyle((s) => ({ ...s, sc: Number(e.target.value) }))} className="w-full" /></label>
          ) : (
            <label className="mb-2 block text-[0.8rem]"><span className="muted mb-1 block">Largeur : {st.w ?? curWidth} px</span>
              <input type="range" min={40} max={1400} step={10} value={st.w ?? curWidth} onChange={(e) => restyle((s) => ({ ...s, w: Number(e.target.value) }))} className="w-full" /></label>
          )}
          <div className="flex flex-wrap gap-3 text-[0.8rem]">
            <button type="button" className="underline" onClick={() => restyle((s) => ({ ...s, x: undefined, y: undefined }), true)}>Remettre à sa place</button>
            <button type="button" className="underline" onClick={() => restyle(() => ({}), true)}>Réinitialiser la mise en forme</button>
          </div>
        </fieldset>
      )}

      <p className="muted mb-3 text-[0.78rem]">{added} zone(s) ajoutée(s) · {hidden} élément(s) supprimé(s). Mêmes réglages dans l&apos;admin › Apparence des pages.</p>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        {hidden > 0 && <button type="button" className="text-sm underline" onClick={restoreAll}>Tout restaurer</button>}
        <button type="button" className="muted text-sm underline" onClick={async () => { if (!confirm("Retirer toutes les modifications directes de cette page (textes, images, zones, positions, mises en forme, suppressions) ?")) return; await resetOverrides(path); location.reload(); }}>Annuler toutes mes modifications</button>
        {msg && <span role="status" className="acc text-sm">{msg}</span>}
      </div>
      {bar}
      {rect && one && sel.length === 1 && (
        <div id="sx-handle" role="slider" aria-label="Agrandir : tirer vers la droite ou la gauche" aria-valuenow={Math.round(rect.width)} onPointerDown={startResize} style={{ left: rect.right - 8, top: rect.bottom - 8 }} />
      )}
      {pick && (
        <MediaPicker open onClose={() => setPick(null)} onPick={(m) => chosen(m.url)} onRemove={pick.mode === "replace" && one ? () => { setPick(null); removeSel(); } : undefined} removeLabel="Supprimer cette image" />
      )}
    </>
  );
}

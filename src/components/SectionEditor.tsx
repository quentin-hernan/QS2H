"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { applyStyle, listSections } from "./sectionDom";
import { BG_ANIMS, BG_TYPES, BG_ZONES, ENTER_ANIMS, cleanStyle, isEmptyStyle, isVideoUrl, type SectionStyle, type StyleMap } from "@/lib/section-style";
import { resetSectionStyle, saveSectionStyle } from "@/app/admin/section-actions";
import { InlineEdit } from "@/components/InlineEdit";
import type { OverridesMap } from "@/lib/overrides";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (<label className="mb-3 block text-[0.82rem]"><span className="muted mb-1 block">{label}</span>{children}</label>);
const Sel = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) => (
  <select className="field !py-2" value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
);
const Range = ({ value, min, max, step = 1, onChange, unit = "" }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) => (
  <span className="flex items-center gap-3"><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" /><span className="w-14 text-right tabular-nums">{value}{unit}</span></span>
);

/** Éditeur visuel : choisir une section de la page, régler son fond, son placement et ses animations, voir le résultat en direct. */
export function SectionEditor({ styles, overrides = {} }: { styles: StyleMap; overrides?: OverridesMap }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [secs, setSecs] = useState<{ el: HTMLElement; label: string }[]>([]);
  const [sel, setSel] = useState<number>(-1);
  const [draft, setDraft] = useState<SectionStyle>({});
  const [pick, setPick] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const local = useRef<StyleMap>(JSON.parse(JSON.stringify(styles)));
  const selRef = useRef(-1);
  selRef.current = sel;

  const refresh = useCallback(() => setSecs(listSections()), []);
  const select = useCallback((i: number, scroll = true) => {
    const list = listSections();
    setSecs(list);
    const s = list[i];
    if (!s) return;
    document.querySelectorAll(".sx-sel").forEach((n) => n.classList.remove("sx-sel"));
    s.el.classList.add("sx-sel");
    s.el.setAttribute("data-sx-edit", "1");
    setSel(i);
    setDraft(local.current[path]?.[String(i)]?.style ?? {});
    setMsg(null);
    if (scroll) s.el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [path]);

  // ouverture : bouton, ou ?edit=1
  useEffect(() => { if (new URLSearchParams(location.search).get("edit") === "1") setOpen(true); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("sx-editing", open);
    if (!open) { document.querySelectorAll(".sx-sel").forEach((n) => n.classList.remove("sx-sel")); setSel(-1); return; }
    refresh();
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("#sx-panel, #sx-toggle, dialog, .slot, [data-ov='m']")) return;
      const list = listSections();
      const i = list.findIndex((s) => s.el.contains(t));
      if (i < 0) return;
      e.preventDefault(); e.stopPropagation();
      select(i, false);
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [open, refresh, select]);
  useEffect(() => { setSel(-1); setSecs([]); if (open) setTimeout(refresh, 500); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // aperçu en direct
  const update = (patch: Partial<SectionStyle> | ((d: SectionStyle) => SectionStyle), replay = false) => {
    setDraft((d) => {
      const next = typeof patch === "function" ? patch(d) : { ...d, ...patch };
      const s = listSections()[selRef.current];
      if (s) applyStyle(s.el, cleanStyle(next), { replay });
      return next;
    });
  };
  const bg = draft.bg ?? { type: "none" as const };
  const setBg = (p: Partial<NonNullable<SectionStyle["bg"]>>) => update((d) => ({ ...d, bg: { ...(d.bg ?? { type: "none" }), ...p } as SectionStyle["bg"] }));
  const enter = draft.enter ?? { type: "none" as const };

  const save = () => start(async () => {
    const clean = cleanStyle(draft);
    const label = secs[sel]?.label ?? "Section";
    const r = isEmptyStyle(clean) ? await resetSectionStyle(path, String(sel)) : await saveSectionStyle(path, String(sel), label, clean);
    if (r.ok) {
      local.current[path] = local.current[path] ?? {};
      if (isEmptyStyle(clean)) delete local.current[path][String(sel)]; else local.current[path][String(sel)] = { label, style: clean };
    }
    setMsg({ ok: r.ok, text: r.ok ? "Enregistré : visible sur le site." : r.error || "Erreur" });
  });
  const reset = () => { const s = secs[sel]; if (!s) return; setDraft({}); applyStyle(s.el, null); setMsg({ ok: true, text: "Réglages retirés (cliquez sur Enregistrer pour confirmer)." }); };

  const label = useMemo(() => secs.map((s, i) => `${i + 1}. ${s.label}`), [secs]);
  const hasBgMedia = bg.type === "image" || bg.type === "video";

  return (
    <>
      <button id="sx-toggle" type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="fixed bottom-4 left-16 z-[85] rounded-full bg-[#2A5587]/90 px-3 py-1.5 text-[0.72rem] font-semibold text-white shadow-md hover:bg-[#1E4068]" title="Visible uniquement par les administrateurs">
        {open ? "Fermer l'éditeur" : "Modifier l'apparence"}
      </button>

      {open && (
        <aside id="sx-panel" aria-label="Éditeur d'apparence de la page" className="dark-section fixed bottom-0 right-0 top-0 z-[86] w-[min(380px,100vw)] overflow-y-auto border-l p-5 text-[0.9rem] shadow-2xl" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .18))" }}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Apparence de la page</h2><button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1 hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]" aria-label="Fermer">✕</button></div>
          <p className="muted mb-4 text-[0.8rem]">Page : <code>{path}</code>. Cliquez sur une section de la page, ou choisissez-la ici.</p>
          <fieldset className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))" }}><legend className="px-2 font-semibold">Textes et images</legend><InlineEdit path={path} local={overrides[path]} /></fieldset>
          <Row label="Section à modifier">
            <select className="field !py-2" value={sel} onChange={(e) => select(Number(e.target.value))}>
              <option value={-1}>— Choisir —</option>
              {label.map((l, i) => <option key={i} value={i}>{l}{local.current[path]?.[String(i)] ? " ●" : ""}</option>)}
            </select>
          </Row>

          {sel >= 0 ? (
            <div>
              <label className="mb-4 flex items-center gap-2"><input type="checkbox" checked={!draft.hidden} onChange={(e) => update({ hidden: e.target.checked ? undefined : true })} /> Afficher cette section</label>

              <fieldset className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))" }}>
                <legend className="px-2 font-semibold">Fond</legend>
                <Row label="Type de fond"><Sel value={bg.type} onChange={(v) => setBg({ type: v })} options={BG_TYPES} /></Row>
                {(bg.type === "color" || bg.type === "gradient") && (
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <input aria-label="Couleur" type="color" value={bg.color ?? "#1C1C1C"} onChange={(e) => setBg({ color: e.target.value })} className="h-10 w-14 rounded border-0 bg-transparent" />
                    {bg.type === "gradient" && <><input aria-label="Seconde couleur" type="color" value={bg.color2 ?? "#2A5587"} onChange={(e) => setBg({ color2: e.target.value })} className="h-10 w-14 rounded border-0 bg-transparent" /><div className="min-w-[160px] flex-1"><Range value={bg.angle ?? 135} min={0} max={360} unit="°" onChange={(v) => setBg({ angle: v })} /></div></>}
                  </div>
                )}
                {hasBgMedia && (
                  <div className="mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {bg.src ? (isVideoUrl(bg.src) ? <video src={bg.src} muted className="h-14 w-24 rounded object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg.src} alt="" className="h-14 w-24 rounded object-cover" />) : <span className="muted">Aucun média.</span>}
                      <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => setPick(true)}>{bg.src ? "Changer" : "Choisir"}</button>
                      {bg.src && <button type="button" className="err text-sm underline" onClick={() => setBg({ src: "" })}>Retirer</button>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Row label="Ajustement"><Sel value={bg.fit ?? "cover"} onChange={(v) => setBg({ fit: v })} options={[{ value: "cover", label: "Remplir" }, { value: "contain", label: "Contenir" }]} /></Row>
                      <Row label="Position"><Sel value={bg.pos ?? "center"} onChange={(v) => setBg({ pos: v })} options={[{ value: "center", label: "Centre" }, { value: "top", label: "Haut" }, { value: "bottom", label: "Bas" }, { value: "left", label: "Gauche" }, { value: "right", label: "Droite" }]} /></Row>
                    </div>
                    <Row label="Flou"><Range value={bg.blur ?? 0} min={0} max={24} unit=" px" onChange={(v) => setBg({ blur: v })} /></Row>
                  </div>
                )}
                {bg.type !== "none" && (
                  <>
                    <p className="muted mb-3 text-xs">Si le texte devient peu lisible, ajoutez un voile ou changez « Couleur du texte » plus bas.</p>
                    <Row label="Opacité du fond"><Range value={bg.alpha ?? 100} min={10} max={100} unit=" %" onChange={(v) => setBg({ alpha: v })} /></Row>
                    <Row label="Voile pour garder le texte lisible"><Range value={bg.overlay ?? 0} min={0} max={90} unit=" %" onChange={(v) => setBg({ overlay: v })} /></Row>
                    {(bg.overlay ?? 0) > 0 && <Row label="Couleur du voile"><Sel value={bg.overlayColor ?? "black"} onChange={(v) => setBg({ overlayColor: v })} options={[{ value: "black", label: "Noir" }, { value: "white", label: "Blanc" }]} /></Row>}
                    <Row label="Emplacement du fond"><Sel value={bg.zone ?? "full"} onChange={(v) => setBg({ zone: v })} options={BG_ZONES} /></Row>
                    {(bg.zone ?? "full") !== "full" && (
                      <>
                        <Row label="Taille de la bande"><Range value={bg.size ?? 50} min={20} max={100} unit=" %" onChange={(v) => setBg({ size: v })} /></Row>
                        <Row label="Coins arrondis"><Range value={bg.radius ?? 0} min={0} max={80} unit=" px" onChange={(v) => setBg({ radius: v })} /></Row>
                      </>
                    )}
                    <Row label="Animation du fond"><Sel value={bg.anim ?? "none"} onChange={(v) => setBg({ anim: v })} options={BG_ANIMS} /></Row>
                  </>
                )}
              </fieldset>

              <fieldset className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))" }}>
                <legend className="px-2 font-semibold">Animation d&apos;apparition</legend>
                <Row label="Effet à l'arrivée dans l'écran"><Sel value={enter.type} onChange={(v) => update({ enter: { ...enter, type: v } }, true)} options={ENTER_ANIMS} /></Row>
                {enter.type !== "none" && (
                  <>
                    <Row label="Durée"><Range value={enter.duration ?? 800} min={200} max={3000} step={100} unit=" ms" onChange={(v) => update({ enter: { ...enter, duration: v } }, true)} /></Row>
                    <Row label="Délai"><Range value={enter.delay ?? 0} min={0} max={3000} step={100} unit=" ms" onChange={(v) => update({ enter: { ...enter, delay: v } }, true)} /></Row>
                    <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => update({}, true)}>Rejouer l&apos;animation</button>
                  </>
                )}
              </fieldset>

              <fieldset className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))" }}>
                <legend className="px-2 font-semibold">Thème et espacement</legend>
                <Row label="Couleur du texte"><Sel value={draft.tone ?? ""} onChange={(v) => update({ tone: v || undefined })} options={[{ value: "", label: "Automatique" }, { value: "light", label: "Fond clair, texte sombre" }, { value: "dark", label: "Fond sombre, texte clair" }]} /></Row>
                <Row label="Espace en haut"><Range value={draft.padTop ?? 0} min={0} max={400} step={8} unit=" px" onChange={(v) => update({ padTop: v })} /></Row>
                <Row label="Espace en bas"><Range value={draft.padBottom ?? 0} min={0} max={400} step={8} unit=" px" onChange={(v) => update({ padBottom: v })} /></Row>
                <Row label="Hauteur minimale"><Range value={draft.minH ?? 0} min={0} max={100} step={5} unit=" %" onChange={(v) => update({ minH: v || null })} /></Row>
                <p className="muted text-xs">Espaces à 0 et hauteur à 0 % : valeurs d&apos;origine du site. Touchez au curseur pour les changer.</p>
              </fieldset>

              <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t px-5 py-4 backdrop-blur" style={{ borderColor: "var(--s-line, rgb(248 248 247 / .16))", background: "color-mix(in srgb, var(--s-bg, #1C1C1C) 94%, transparent)" }}>
                <button type="button" className="btn btn-primary !min-h-[44px] !px-5 !py-2.5" disabled={pending} onClick={save}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
                <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5" onClick={reset}>Réinitialiser</button>
                {msg && <p role="status" className={`w-full text-[0.82rem] ${msg.ok ? "acc" : "err"}`}>{msg.text}</p>}
              </div>
            </div>
          ) : <p className="muted">Aucune section sélectionnée.</p>}

          <MediaPicker open={pick} onClose={() => setPick(false)} onPick={(m) => { setBg({ src: m.url, type: m.kind === "video" || isVideoUrl(m.url) ? "video" : "image" }); setPick(false); }} />
        </aside>
      )}
    </>
  );
}

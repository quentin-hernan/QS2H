"use client";
import { useState, useTransition } from "react";
import { MediaPicker } from "./MediaPicker";
import { savePageOverrides, saveSlot } from "@/app/admin/section-actions";
import type { OverridesMap, PageOverrides } from "@/lib/overrides";

const ring = { borderColor: "rgb(242 239 233 / .14)" } as const;
const isVid = (u: string) => /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u);
const Thumb = ({ src }: { src: string }) => !src || src === "none"
  ? <span className="muted inline-grid h-12 w-20 place-items-center rounded border text-xs" style={ring}>aucune</span>
  : isVid(src) ? <video src={src} muted className="h-12 w-20 rounded object-cover" />
  // eslint-disable-next-line @next/next/no-img-element
  : <img src={src} alt="" className="h-12 w-20 rounded object-cover" />;

/**
 * Les modifications faites dans l'éditeur visuel, page par page, modifiables ici aussi :
 * textes réécrits, images remplacées, éléments supprimés, zones ajoutées, emplacements d'image.
 */
export function OverridesAdmin({ pages, initial, slots: initialSlots }: { pages: [string, string][]; initial: OverridesMap; slots: Record<string, string> }) {
  const [map, setMap] = useState<OverridesMap>(initial);
  const [slots, setSlots] = useState(initialSlots);
  const [pick, setPick] = useState<null | ((url: string) => void)>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const known = new Map(pages);
  const paths = [...new Set([...pages.map((p) => p[0]), ...Object.keys(map)])];

  const save = (path: string, next: PageOverrides) => start(async () => {
    const r = await savePageOverrides(path, next);
    if (r.ok) setMap((m) => ({ ...m, [path]: next }));
    setMsg((m) => ({ ...m, [path]: r.ok ? "Enregistré : visible sur le site." : r.error || "Erreur" }));
  });
  const edit = (path: string, fn: (p: PageOverrides) => void) => {
    const next: PageOverrides = JSON.parse(JSON.stringify(map[path] ?? {}));
    fn(next);
    for (const k of ["t", "m", "x", "s"] as const) if (next[k] && !Object.keys(next[k]!).length) delete next[k];
    if (next.a && !next.a.length) delete next.a;
    if (next.f && !next.f.length) delete next.f;
    save(path, next);
  };

  return (
    <div className="space-y-4">
      {paths.map((path) => {
        const p = map[path] ?? {};
        const n = Object.keys(p.t ?? {}).length + Object.keys(p.m ?? {}).length + Object.keys(p.x ?? {}).length + Object.keys(p.s ?? {}).length + (p.a?.length ?? 0) + (p.f?.length ?? 0);
        return (
          <details key={path} className="rounded-2xl border" style={ring}>
            <summary className="flex flex-wrap items-center justify-between gap-3 p-5">
              <span><strong>{known.get(path) ?? path}</strong> <span className="muted text-sm">{path}</span></span>
              <span className="flex items-center gap-4"><span className={n ? "acc text-sm" : "muted text-sm"}>{n ? `${n} modification(s)` : "aucune modification"}</span><a href={`${path}?edit=1`} target="_blank" rel="noreferrer" className="btn btn-ghost !min-h-[38px] !px-4 !py-2 text-sm" onClick={(e) => e.stopPropagation()}>Ouvrir dans l&apos;éditeur ↗</a></span>
            </summary>
            <div className="space-y-6 border-t p-5" style={ring}>
              {n === 0 && <p className="muted text-sm">Ouvrez la page dans l&apos;éditeur, cliquez sur un texte ou une image : les modifications apparaîtront ici et resteront modifiables des deux côtés.</p>}

              {p.t && <section><h3 className="mb-3 font-medium">Textes réécrits</h3><ul className="space-y-3">
                {Object.entries(p.t).map(([i, e]) => (
                  <li key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <span className="muted text-sm line-through decoration-1">{e.o}</span>
                    <textarea defaultValue={e.v} rows={Math.min(4, Math.ceil(e.v.length / 60))} className="field !py-2 text-sm" onBlur={(ev) => { const v = ev.target.value.trim(); if (v && v !== e.v) edit(path, (q) => { q.t![i] = { o: e.o, v }; }); }} />
                    <button type="button" className="err text-sm underline" onClick={() => edit(path, (q) => { delete q.t![i]; })}>Texte d&apos;origine</button>
                  </li>))}
              </ul></section>}

              {p.m && <section><h3 className="mb-3 font-medium">Images remplacées</h3><ul className="space-y-3">
                {Object.entries(p.m).map(([i, e]) => (
                  <li key={i} className="flex flex-wrap items-center gap-3">
                    <Thumb src={e.o} /><span aria-hidden="true">→</span><Thumb src={e.v} />
                    <button type="button" className="btn btn-ghost !min-h-[38px] !px-4 !py-2 text-sm" onClick={() => setPick(() => (url: string) => edit(path, (q) => { q.m![i] = { o: e.o, v: url }; }))}>Changer</button>
                    <button type="button" className="err text-sm underline" onClick={() => edit(path, (q) => { delete q.m![i]; })}>Image d&apos;origine</button>
                  </li>))}
              </ul></section>}

              {p.a && <section><h3 className="mb-3 font-medium">Zones ajoutées</h3><ol className="space-y-3">
                {p.a.map((a, n) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3">
                    <span className="muted w-16 text-xs uppercase">{a.k === "img" ? "Image" : "Texte"}</span>
                    {a.k === "img"
                      ? <><Thumb src={a.v} /><button type="button" className="btn btn-ghost !min-h-[38px] !px-4 !py-2 text-sm" onClick={() => setPick(() => (url: string) => edit(path, (q) => { q.a![n] = { ...a, v: url }; }))}>Changer</button></>
                      : <textarea defaultValue={a.v} rows={2} className="field min-w-[240px] flex-1 !py-2 text-sm" onBlur={(ev) => { const v = ev.target.value.trim(); if (v && v !== a.v) edit(path, (q) => { q.a![n] = { ...a, v }; }); }} />}
                    <span className="muted text-xs">après « {a.o.startsWith("/") || a.o.startsWith("http") ? "une image" : a.o.slice(0, 40)} »</span>
                    <span className="flex gap-1">
                      <button type="button" aria-label="Monter" className="rounded px-2 hover:bg-white/10" disabled={n === 0} onClick={() => edit(path, (q) => { const l = q.a!; [l[n - 1], l[n]] = [l[n], l[n - 1]]; })}>↑</button>
                      <button type="button" aria-label="Descendre" className="rounded px-2 hover:bg-white/10" disabled={n === p.a!.length - 1} onClick={() => edit(path, (q) => { const l = q.a!; [l[n + 1], l[n]] = [l[n], l[n + 1]]; })}>↓</button>
                    </span>
                    <button type="button" className="err text-sm underline" onClick={() => edit(path, (q) => { q.a = q.a!.filter((x) => x.id !== a.id); })}>Supprimer</button>
                  </li>))}
              </ol></section>}

              {p.f && <section><h3 className="mb-3 font-medium">Zones libres (placées n&apos;importe où)</h3><ul className="space-y-3">
                {p.f.map((z, n) => (
                  <li key={z.id} className="flex flex-wrap items-center gap-3">
                    <span className="muted w-24 text-xs uppercase">{z.k === "img" ? "Image" : "Texte"} · section {z.sec + 1}</span>
                    {z.k === "img"
                      ? <><Thumb src={z.v} /><button type="button" className="btn btn-ghost !min-h-[38px] !px-4 !py-2 text-sm" onClick={() => setPick(() => (url: string) => edit(path, (q) => { q.f![n] = { ...z, v: url }; }))}>Changer</button></>
                      : <textarea defaultValue={z.v} rows={2} className="field min-w-[240px] flex-1 !py-2 text-sm" onBlur={(ev) => { const v = ev.target.value.trim(); if (v && v !== z.v) edit(path, (q) => { q.f![n] = { ...z, v }; }); }} />}
                    <span className="muted text-xs">x {Math.round(z.x)} % · y {Math.round(z.y)} px</span>
                    <button type="button" className="err text-sm underline" onClick={() => edit(path, (q) => { q.f = q.f!.filter((x) => x.id !== z.id); })}>Supprimer</button>
                  </li>))}
              </ul></section>}

              {p.s && <section><h3 className="mb-3 font-medium">Éléments déplacés ou mis en forme</h3><ul className="space-y-2">
                {Object.entries(p.s).map(([k, e]) => (
                  <li key={k} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="muted">{k.startsWith("t:") ? "Texte" : k.startsWith("m:") ? "Image" : "Icône"} {k.startsWith("m:") || k.startsWith("i:") ? "" : "« " + e.o.slice(0, 50) + " »"}</span>
                    <span className="muted text-xs">{[e.st.x || e.st.y ? "déplacé" : "", e.st.w ? `largeur ${e.st.w}px` : "", e.st.sc ? `échelle ${e.st.sc}%` : "", e.st.fs ? `taille ${e.st.fs}px` : "", e.st.ff ? "police" : "", e.st.ta ? "alignement" : "", e.st.b || e.st.i || e.st.u ? "style" : "", e.st.c ? "couleur" : ""].filter(Boolean).join(" · ")}</span>
                    <button type="button" className="text-sm underline" onClick={() => edit(path, (q) => { delete q.s![k]; })}>Remettre l&apos;original</button>
                  </li>))}
              </ul></section>}

              {p.x && <section><h3 className="mb-3 font-medium">Éléments supprimés</h3><ul className="space-y-2">
                {Object.entries(p.x).map(([k, e]) => (
                  <li key={k} className="flex flex-wrap items-center gap-3">
                    {k.startsWith("m:") ? <Thumb src={e.o} /> : <span className="muted text-sm line-through">{e.o.slice(0, 120)}</span>}
                    <button type="button" className="text-sm underline" onClick={() => edit(path, (q) => { delete q.x![k]; })}>Restaurer</button>
                  </li>))}
              </ul></section>}

              {msg[path] && <p role="status" className="acc text-sm">{pending ? "Enregistrement…" : msg[path]}</p>}
            </div>
          </details>
        );
      })}

      {Object.keys(slots).length > 0 && (
        <details className="rounded-2xl border" style={ring}>
          <summary className="p-5"><strong>Emplacements d&apos;image</strong> <span className="muted text-sm">(photos d&apos;équipe, pastilles, visuels de formules…)</span></summary>
          <ul className="space-y-3 border-t p-5" style={ring}>
            {Object.entries(slots).map(([id, url]) => (
              <li key={id} className="flex flex-wrap items-center gap-3">
                <Thumb src={url} /><code className="muted text-xs">{id}</code>
                <button type="button" className="btn btn-ghost !min-h-[38px] !px-4 !py-2 text-sm" onClick={() => setPick(() => (u: string) => start(async () => { await saveSlot(id, u); setSlots((s) => ({ ...s, [id]: u })); }))}>Changer</button>
                <button type="button" className="err text-sm underline" onClick={() => start(async () => { await saveSlot(id, ""); setSlots((s) => { const c = { ...s }; delete c[id]; return c; }); })}>Image par défaut</button>
              </li>))}
          </ul>
        </details>
      )}

      {pick && <MediaPicker open onClose={() => setPick(null)} onPick={(m) => { const f = pick; setPick(null); f(m.url); }} />}
    </div>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { MediaField } from "./Misc";
import { Sections } from "@/components/Sections";
import { SECTION_DEFS, defOf, newSection, type FieldDef, type Item, type Section, type SectionType } from "@/lib/sections";
import { deleteCustomPage, saveCustomPage } from "@/app/admin/page-actions";

const ring = { borderColor: "rgb(242 239 233 / .16)" } as const;

function Field({ f, id, value, onChange }: { f: FieldDef; id: string; value: string; onChange: (v: string) => void }) {
  if (f.type === "media") return <MediaField id={id} label={f.label} value={value} onChange={(url) => onChange(url)} />;
  return (
    <div>
      <label className="label" htmlFor={id}>{f.label}</label>
      {f.type === "textarea" ? <textarea id={id} rows={4} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
        : f.type === "select" ? <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>{f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

export function PageBuilder({ id, initial }: { id: string; initial: { title: string; slug: string; description: string; published: boolean; sections: Section[] } }) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description);
  const [published, setPublished] = useState(initial.published);
  const [sections, setSections] = useState<Section[]>(initial.sections);
  const [open, setOpen] = useState<string | null>(initial.sections[0]?.id ?? null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const history = useRef<Section[][]>([]);
  const dragFrom = useRef<number | null>(null);

  const commit = useCallback((next: Section[] | ((p: Section[]) => Section[])) => {
    setSections((p) => { history.current = [...history.current.slice(-29), p]; return typeof next === "function" ? next(p) : next; });
    setDirty(true);
  }, []);
  const undo = useCallback(() => { const prev = history.current.pop(); if (prev) { setSections(prev); setDirty(true); } }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !(e.target as HTMLElement).matches("input,textarea")) { e.preventDefault(); undo(); } };
    const b = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    addEventListener("keydown", k); addEventListener("beforeunload", b);
    return () => { removeEventListener("keydown", k); removeEventListener("beforeunload", b); };
  }, [undo, dirty]);

  const setField = (sid: string, name: string, v: string | Item[]) => commit((p) => p.map((s) => (s.id === sid ? { ...s, d: { ...s.d, [name]: v } } : s)));
  const move = (from: number, to: number) => commit((p) => { if (to < 0 || to >= p.length || from === to) return p; const a = [...p]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; });
  const add = (t: SectionType) => { const s = newSection(t); commit((p) => [...p, s]); setOpen(s.id); };
  const dup = (i: number) => commit((p) => { const c = JSON.parse(JSON.stringify(p[i])) as Section; c.id = newSection(c.type).id; const a = [...p]; a.splice(i + 1, 0, c); return a; });
  const del = (i: number) => commit((p) => p.filter((_, n) => n !== i));

  const save = () => start(async () => {
    setMsg(null);
    const r = await saveCustomPage(id, { title, slug, description, published, sections });
    setMsg({ ok: r.ok, text: r.ok ? (published ? "Enregistré et publié." : "Enregistré (brouillon : la page n'est pas visible sur le site).") : r.error || "Erreur" });
    if (r.ok) setDirty(false);
  });

  const width = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Mode">
          {(["edit", "preview"] as const).map((v) => (<button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-full px-4 py-2 text-sm ${view === v ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`}>{v === "edit" ? "Édition" : "Aperçu"}</button>))}
        </div>
        {view === "preview" && (
          <div className="flex gap-2" role="group" aria-label="Appareil">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (<button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded-full border px-3 py-1.5 text-sm ${device === d ? "bg-white/15" : ""}`} style={ring}>{d === "desktop" ? "Ordinateur" : d === "tablet" ? "Tablette" : "Mobile"}</button>))}
          </div>
        )}
        <button type="button" onClick={undo} className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" disabled={!history.current.length}>Annuler la dernière action</button>
        {published && <Link href={`/${slug}`} target="_blank" className="acc ml-auto underline">Voir la page publiée ↗</Link>}
      </div>

      {view === "preview" ? (
        <div className="overflow-auto rounded-2xl border" style={{ ...ring, maxHeight: "75vh", background: "#F8F8F7" }}>
          <div className="mx-auto" style={{ width, maxWidth: "100%", transition: "width .4s" }}>
            <div className="pointer-events-none" style={{ zoom: device === "desktop" ? 0.62 : 1 }}>
              <Sections sections={sections} title={title} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-5 rounded-2xl border p-6 md:grid-cols-2" style={ring} aria-label="Réglages de la page">
            <div><label className="label" htmlFor="pb-title">Titre de la page</label><input id="pb-title" className="field" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} /></div>
            <div><label className="label" htmlFor="pb-slug">Adresse (https://…/<strong>{slug || "adresse"}</strong>)</label><input id="pb-slug" className="field" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); setDirty(true); }} /></div>
            <div className="md:col-span-2"><label className="label" htmlFor="pb-desc">Description pour Google (150 caractères conseillés)</label><textarea id="pb-desc" rows={2} className="field" value={description} onChange={(e) => { setDescription(e.target.value); setDirty(true); }} /></div>
            <label className="flex items-center gap-3 md:col-span-2"><input type="checkbox" className="h-5 w-5" checked={published} onChange={(e) => { setPublished(e.target.checked); setDirty(true); }} /> Publier la page (visible sur le site)</label>
          </section>

          <ol className="space-y-3" aria-label="Sections de la page">
            {sections.length === 0 && <li className="muted rounded-2xl border p-8 text-center" style={ring}>Page vide. Ajoutez une première section ci-dessous.</li>}
            {sections.map((sec, i) => {
              const def = defOf(sec.type)!;
              const isOpen = open === sec.id;
              const label = (sec.d.title as string) || (sec.d.q as string) || def.label;
              return (
                <li key={sec.id} className="rounded-2xl border" style={ring} draggable={false}
                  onDragOver={(e) => { if (dragFrom.current !== null) e.preventDefault(); }}
                  onDrop={() => { if (dragFrom.current !== null) { move(dragFrom.current, i); dragFrom.current = null; } }}>
                  <div className="flex items-center gap-2 p-3">
                    <span draggable onDragStart={() => { dragFrom.current = i; }} onDragEnd={() => { dragFrom.current = null; }} className="muted cursor-grab select-none px-2 text-xl" aria-hidden="true" title="Glisser pour déplacer">⋮⋮</span>
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : sec.id)} className="flex-1 text-left"><span className="muted block text-xs uppercase tracking-wider">{def.label}</span><span className="block truncate font-medium">{label}</span></button>
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Monter la section" className="rounded-full px-3 py-2 hover:bg-white/10 disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label="Descendre la section" className="rounded-full px-3 py-2 hover:bg-white/10 disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => dup(i)} className="rounded-full px-3 py-2 text-sm hover:bg-white/10">Dupliquer</button>
                    <button type="button" onClick={() => { if (confirm("Supprimer cette section ?")) del(i); }} className="err rounded-full px-3 py-2 text-sm hover:bg-white/10">Supprimer</button>
                  </div>
                  {isOpen && (
                    <div className="grid gap-5 border-t p-5 md:grid-cols-2" style={ring}>
                      {def.fields.map((f) => (
                        <div key={f.name} className={f.type === "textarea" || f.type === "media" ? "md:col-span-2" : ""}>
                          <Field f={f} id={`${sec.id}-${f.name}`} value={(sec.d[f.name] as string) ?? ""} onChange={(v) => setField(sec.id, f.name, v)} />
                        </div>
                      ))}
                      {def.list && (
                        <fieldset className="md:col-span-2"><legend className="label">{def.list.label}</legend>
                          <ul className="space-y-3">
                            {((sec.d[def.list.name] as Item[]) ?? []).map((it, n) => (
                              <li key={n} className="rounded-xl border p-4" style={ring}>
                                <div className="grid gap-4">
                                  {def.list!.fields.map((f) => (<Field key={f.name} f={f} id={`${sec.id}-${n}-${f.name}`} value={it[f.name] ?? ""} onChange={(v) => setField(sec.id, def.list!.name, ((sec.d[def.list!.name] as Item[]) ?? []).map((x, m) => (m === n ? { ...x, [f.name]: v } : x)))} />))}
                                </div>
                                <div className="mt-3 flex gap-4 text-sm">
                                  <button type="button" disabled={n === 0} className="underline disabled:opacity-30" onClick={() => { const a = [...(sec.d[def.list!.name] as Item[])]; [a[n - 1], a[n]] = [a[n], a[n - 1]]; setField(sec.id, def.list!.name, a); }}>Monter</button>
                                  <button type="button" className="err underline" onClick={() => setField(sec.id, def.list!.name, (sec.d[def.list!.name] as Item[]).filter((_, m) => m !== n))}>Supprimer</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {((sec.d[def.list.name] as Item[]) ?? []).length < def.list.max && (
                            <button type="button" className="btn btn-ghost mt-3 !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => setField(sec.id, def.list!.name, [...((sec.d[def.list!.name] as Item[]) ?? []), Object.fromEntries(def.list!.fields.map((f) => [f.name, ""]))])}>+ {def.list.addLabel}</button>
                          )}
                        </fieldset>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <section aria-label="Ajouter une section">
            <p className="eyebrow mb-4">Ajouter une section</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_DEFS.map((d) => (<button key={d.type} type="button" onClick={() => add(d.type)} className="rounded-2xl border p-4 text-left transition-colors hover:bg-white/5" style={ring}><span className="block font-medium">+ {d.label}</span><span className="muted block text-sm">{d.hint}</span></button>))}
            </div>
          </section>
        </>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border p-4 backdrop-blur" style={{ ...ring, background: "rgb(20 23 28 / .92)" }}>
        <button type="button" className="btn btn-primary" disabled={pending} onClick={save}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {dirty && <span className="muted text-sm">Modifications non enregistrées</span>}
        {msg && <span role={msg.ok ? "status" : "alert"} className={msg.ok ? "acc" : "err"}>{msg.text}</span>}
        <form action={deleteCustomPage.bind(null, id)} className="ml-auto" onSubmit={(e) => { if (!confirm("Supprimer définitivement cette page ?")) e.preventDefault(); }}><button className="err text-sm underline">Supprimer la page</button></form>
      </div>
    </div>
  );
}

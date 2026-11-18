"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Field, Resource } from "@/lib/admin-resources";
import { captureProject, saveResource } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { MediaPicker, type MediaItem } from "./MediaPicker";
import { RichText } from "./RichText";
import { MetaView, PlanesEditor, type PlaneV } from "./PlanesEditor";

type Vals = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Errs = Record<string, string[] | undefined>;

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function ResourceForm({ resource, id, initial, serviceOptions }: { resource: Resource; id: string; initial: Vals; serviceOptions: { value: string; label: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState<Vals>(() => {
    const o: Vals = {};
    for (const f of resource.fields) {
      const x = initial[f.name];
      o[f.name] = f.type === "datetime" ? toLocal(x) : x ?? (["list", "images", "multiselect", "objlist", "planes"].includes(f.type) ? [] : f.type === "meta" ? {} : f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    }
    return o;
  });
  const [errors, setErrors] = useState<Errs>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(id !== "new");
  const [picker, setPicker] = useState<{ field: string; multi: boolean; cb?: (u: string) => void } | null>(null);
  const [pending, start] = useTransition();
  const [capturing, startCap] = useTransition();
  const [capMsg, setCapMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /** Réalisations : à partir de la seule URL, récupère titre, description, image de couverture, technologies, scores et vues (bureau, tablette, mobile). */
  function runCapture() {
    const url = String(v.url || "").trim();
    if (!url) { setCapMsg({ ok: false, text: "Renseignez d'abord l'URL du site." }); return; }
    if (!confirm("Récupérer depuis ce site : titre, description, image de couverture, technologies, scores et vues (bureau, tablette, mobile).\n\nLes valeurs actuelles de ces champs seront remplacées. Continuer ?")) return;
    setCapMsg(null);
    startCap(async () => {
      const r = await captureProject(url, String(v.title || ""));
      if (!r.ok) { setCapMsg({ ok: false, text: r.error }); return; }
      const m = r.meta as unknown as Record<string, unknown>;
      const site = String(m.siteName || "").trim();
      const rawTitle = String(m.ogTitle || m.title || "").trim();
      const title = (rawTitle.split(/\s[|–—-]\s/)[0] || rawTitle).trim();
      const desc = String(m.ogDescription || m.description || "").trim();
      const filled = [r.cover && "image de couverture", Array.isArray(m.technologies) && m.technologies.length && "technologies", desc && "description", title && "titre"].filter(Boolean) as string[];
      setDirty(true);
      setV((p) => {
        const n: Vals = { ...p, planes: r.planes, meta: m };
        if (r.cover) n.cover = r.cover;
        if (Array.isArray(m.technologies) && m.technologies.length) n.technologies = m.technologies;
        if (desc) n.summary = desc.slice(0, 300);
        if (title) n.title = title.slice(0, 120);
        if (!String(p.client || "").trim() && (site || title)) n.client = (site || title).slice(0, 120);
        if ((!slugTouched || !p.slug) && n.title) n.slug = slugify(String(n.title));
        if (!p.year) n.year = new Date().getFullYear();
        if (!String(p.seoDescription || "").trim() && desc) n.seoDescription = desc.slice(0, 170);
        return n;
      });
      const lh = m.lighthouse as { performance?: number } | null;
      setCapMsg({ ok: true, text: `Récupéré : ${r.planes.length} vues, ${filled.join(", ") || "aucun texte"}${lh ? ", scores PageSpeed" : ""}. Relisez puis enregistrez.` });
    });
  }

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (name: string, val: unknown) => {
    setDirty(true);
    setV((p) => {
      const n = { ...p, [name]: val };
      const slugField = resource.fields.find((f) => f.type === "slug");
      if (slugField && !slugTouched && slugField.from === name) n[slugField.name] = slugify(String(val));
      return n;
    });
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErrors({});
    start(async () => {
      const r = await saveResource(resource.key, id, v);
      if (!r.ok) { setErrors(r.fields ?? {}); setMsg({ ok: false, text: r.error || "Erreur." }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      setDirty(false);
      setMsg({ ok: true, text: "Enregistré. Le site public est mis à jour." });
      if (id === "new" && r.id) router.replace(`/admin/${resource.key}/${r.id}`);
      else router.refresh();
    });
  }

  const preview = useMemo(() => resource.preview, [resource]);

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl border p-4 ${msg.ok ? "acc acc-border" : "err"}`}>{msg.text}</p>}
        {capMsg && <p role={capMsg.ok ? "status" : "alert"} className={`rounded-xl border p-4 ${capMsg.ok ? "acc acc-border" : "err"}`}>{capMsg.text}</p>}
        <div className="grid gap-6 md:grid-cols-2">
          {resource.fields.map((f) => (
            <div key={f.name} className={f.half ? "" : "md:col-span-2"}>
              <FieldInput f={f} all={v} setField={set} pickImage={(cb) => setPicker({ field: f.name, multi: false, cb })} value={v[f.name]} error={errors[f.name]?.[0]} onChange={(x) => { if (f.type === "slug") setSlugTouched(true); set(f.name, x); }} serviceOptions={serviceOptions} onCapture={resource.key === "realisations" ? runCapture : undefined} capturing={capturing} openPicker={(multi) => setPicker({ field: f.name, multi })} />
            </div>
          ))}
        </div>
        <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-2xl border p-4 backdrop-blur" style={{ borderColor: "rgb(242 239 233 / .16)", background: "rgb(20 23 28 / .92)" }}>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Enregistrement…" : id === "new" ? "Créer" : "Enregistrer"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push(`/admin/${resource.key}`)}>Retour à la liste</button>
          {dirty && <span className="muted text-sm" aria-live="polite">Modifications non enregistrées</span>}
        </div>
      </div>

      {preview && (
        <aside aria-label="Aperçu" className="xl:sticky xl:top-8 xl:self-start">
          <p className="eyebrow mb-4">Aperçu avant publication</p>
          {preview === "project" ? (
            <div className="light-section overflow-hidden rounded-2xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {v.cover ? <img src={v.cover} alt="" className="aspect-video w-full rounded-xl object-cover object-top" /> : <div className="flex aspect-video items-center justify-center rounded-xl bg-ivory-200 text-xs text-mute-light">Aucune image</div>}
              <h3 className="mt-4 text-xl font-medium">{v.title || "Titre"}</h3>
              <p className="muted mt-1 text-sm">{v.summary || "Description courte…"}</p>
              <p className="muted mt-2 text-xs uppercase tracking-wider">{v.sector}</p>
              <p className={`mt-3 text-xs ${v.status === "published" ? "acc" : "muted"}`}>{v.status === "published" ? "● Publié" : "○ Brouillon (invisible)"}</p>
            </div>
          ) : (
            <div className="light-section max-h-[70vh] overflow-auto rounded-2xl p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {v.cover ? <img src={v.cover} alt="" className="mb-5 aspect-video w-full rounded-xl object-cover" /> : null}
              <p className="muted text-xs uppercase tracking-wider">{v.category}</p>
              <h3 className="mt-2 text-2xl font-medium">{v.title || "Titre"}</h3>
              <p className="muted mt-2">{v.excerpt}</p>
              <div className="prose-qs mt-5" dangerouslySetInnerHTML={{ __html: v.content }} />
              <p className={`mt-6 text-xs ${v.status === "published" ? "acc" : "muted"}`}>{v.status === "published" ? "● Publié" : "○ Brouillon (invisible)"}</p>
            </div>
          )}
        </aside>
      )}

      <MediaPicker
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={(m: MediaItem) => { if (!picker) return; if (picker.cb) { picker.cb(m.url); setPicker(null); return; } set(picker.field, picker.multi ? [...(v[picker.field] as string[]), m.url] : m.url); setPicker(null); }}
      />
    </form>
  );
}

function FieldInput({ f, value, error, onChange, serviceOptions, openPicker, all, setField, pickImage, onCapture, capturing }: { onCapture?: () => void; capturing?: boolean; all: Vals; setField: (n: string, v: unknown) => void; pickImage: (cb: (u: string) => void) => void; f: Field; value: any; error?: string; onChange: (v: unknown) => void; serviceOptions: { value: string; label: string }[]; openPicker: (multi: boolean) => void }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const id = `f-${f.name}`;
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-e` : f.hint ? `${id}-h` : undefined } as const;
  const Label = <label className="label" htmlFor={id}>{f.label}{f.required && " *"}</label>;
  const Hint = f.hint && !error ? <p id={`${id}-h`} className="muted mt-1.5 text-[0.8rem]">{f.hint}</p> : null;
  const Err = error ? <p id={`${id}-e`} role="alert" className="err">{error}</p> : null;

  switch (f.type) {
    case "text": case "slug":
      if (f.name === "url" && onCapture) return (
        <div>{Label}<div className="flex flex-wrap gap-3"><input id={id} className="field min-w-[240px] flex-1" value={value} placeholder="https://…" onChange={(e) => onChange(e.target.value)} {...aria} /><button type="button" className="btn btn-primary !min-h-[48px] !px-5" disabled={capturing || !String(value).trim()} onClick={onCapture}>{capturing ? "Récupération… (30 à 90 s)" : "Tout récupérer depuis ce site"}</button></div><p className="muted mt-1.5 text-[0.8rem]">Remplit titre, description, image de couverture, technologies, scores PageSpeed et les vues bureau / tablette / mobile de la vue éclatée.</p>{Err}</div>
      );
      return <div>{Label}<input id={id} className="field" value={value} maxLength={f.max} onChange={(e) => onChange(e.target.value)} {...aria} />{f.max && <p className="muted mt-1 text-right text-xs">{String(value).length}/{f.max}</p>}{Hint}{Err}</div>;
    case "textarea":
      return <div>{Label}<textarea id={id} rows={f.rows ?? 4} className="field" value={value} maxLength={f.max} onChange={(e) => onChange(e.target.value)} {...aria} />{f.max && <p className="muted mt-1 text-right text-xs">{String(value).length}/{f.max}</p>}{Hint}{Err}</div>;
    case "number":
      return <div>{Label}<input id={id} type="number" min={f.min ?? 0} step={f.decimal ? "0.01" : "1"} className="field" value={value} onChange={(e) => onChange(Number(e.target.value))} {...aria} />{Hint}{Err}</div>;
    case "boolean":
      return <label className="flex cursor-pointer items-center gap-3 py-2"><input type="checkbox" className="h-5 w-5 accent-[rgb(127,169,217)]" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span>{f.label}</span></label>;
    case "select":
      return <div>{Label}<select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} {...aria}>{(f.options as { value: string; label: string }[]).map((o) => (<option key={o.value} value={o.value} className="text-black">{o.label}</option>))}</select>{Err}</div>;
    case "datetime":
      return <div>{Label}<input id={id} type="datetime-local" className="field" value={value} onChange={(e) => onChange(e.target.value)} />{Hint}{Err}</div>;
    case "list":
      return <div>{Label}<textarea id={id} rows={Math.max(4, (value as string[]).length + 1)} className="field" value={(value as string[]).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} {...aria} />{Hint}{Err}</div>;
    case "multiselect": {
      const opts = f.options === "services" ? serviceOptions : (f.options as { value: string; label: string }[]);
      return (<fieldset><legend className="label">{f.label}</legend><div className="flex flex-wrap gap-2">{opts.map((o) => { const on = (value as string[]).includes(o.value); return (<label key={o.value} className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${on ? "bg-ivory text-ink-900" : "hover:bg-white/10"}`} style={{ borderColor: "rgb(242 239 233 / .25)" }}><input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? (value as string[]).filter((x) => x !== o.value) : [...(value as string[]), o.value])} />{o.label}</label>); })}</div></fieldset>);
    }
    case "image":
      return (<div><span className="label">{f.label}</span><div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-24 w-36 rounded-lg border object-cover" style={{ borderColor: "rgb(242 239 233 / .2)" }} /> : <div className="muted flex h-24 w-36 items-center justify-center rounded-lg border text-xs" style={{ borderColor: "rgb(242 239 233 / .2)" }}>Aucune image</div>}
        <div className="flex flex-col gap-2"><button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => openPicker(false)}>{value ? "Changer" : "Choisir une image"}</button>{value && <button type="button" className="muted text-left text-sm underline" onClick={() => onChange("")}>Retirer</button>}</div></div>{Hint}</div>);
    case "images":
      return (<div><span className="label">{f.label}</span><ul className="mb-3 flex flex-wrap gap-3">{(value as string[]).map((u, i) => (<li key={u + i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" className="h-20 w-28 rounded-lg border object-cover" style={{ borderColor: "rgb(242 239 233 / .2)" }} /><button type="button" aria-label="Retirer cette image" onClick={() => onChange((value as string[]).filter((_, k) => k !== i))} className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ivory text-sm text-ink-900">✕</button></li>))}</ul><button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => openPicker(true)}>Ajouter une image</button></div>);
    case "objlist": {
      const rows = value as Record<string, string>[];
      const upd = (i: number, k: string, x: string) => onChange(rows.map((r, n) => (n === i ? { ...r, [k]: x } : r)));
      const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= rows.length) return; const c = [...rows]; [c[i], c[j]] = [c[j], c[i]]; onChange(c); };
      return (<fieldset><legend className="label">{f.label}</legend><ul className="space-y-3">{rows.map((r, i) => (
        <li key={i} className="rounded-xl border p-4" style={{ borderColor: "rgb(242 239 233 / .16)" }}>
          <div className="grid gap-3">{f.itemFields!.map((it) => (<div key={it.name}><label className="label" htmlFor={`${id}-${i}-${it.name}`}>{it.label}</label>{it.type === "image" ? (<div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}{r[it.name] ? <img src={r[it.name]} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <span className="muted text-xs">Aucune image</span>}<button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => pickImage((u) => upd(i, it.name, u))}>{r[it.name] ? "Changer" : "Choisir une image"}</button>{r[it.name] && <button type="button" className="muted text-sm underline" onClick={() => upd(i, it.name, "")}>Retirer</button>}</div>) : it.type === "textarea" ? <textarea id={`${id}-${i}-${it.name}`} rows={3} className="field" value={r[it.name] ?? ""} onChange={(e) => upd(i, it.name, e.target.value)} /> : <input id={`${id}-${i}-${it.name}`} className="field" value={r[it.name] ?? ""} onChange={(e) => upd(i, it.name, e.target.value)} />}</div>))}</div>
          <div className="mt-3 flex gap-2 text-sm"><button type="button" className="muted underline" onClick={() => move(i, -1)}>↑ Monter</button><button type="button" className="muted underline" onClick={() => move(i, 1)}>↓ Descendre</button><button type="button" className="err ml-auto underline" onClick={() => onChange(rows.filter((_, k) => k !== i))}>Supprimer</button></div>
        </li>))}</ul><button type="button" className="btn btn-ghost mt-3 !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => onChange([...rows, Object.fromEntries(f.itemFields!.map((i) => [i.name, ""]))])}>+ Ajouter</button></fieldset>);
    }
    case "planes":
      return <PlanesEditor onCapture={onCapture} capturing={capturing} value={value as PlaneV[]} onChange={onChange} url={String(all.url || "")} title={String(all.title || "")} onMeta={(m) => { setField("meta", m); if (Array.isArray(m.technologies) && !(all.technologies as string[]).filter(Boolean).length) setField("technologies", m.technologies); }} pickImage={pickImage} />;
    case "meta":
      return <MetaView meta={value as Record<string, unknown>} onClear={() => onChange({})} />;
    case "richtext":
      return <div><span className="label">{f.label}{f.required && " *"}</span><RichText value={value} onChange={onChange} />{Err}</div>;
  }
}

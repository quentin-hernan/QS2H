"use client";
import { useRef, useState, useTransition } from "react";
import { captureProject, importPlaneImages } from "@/app/admin/actions";

export type PlaneV = { id: string; name: string; kind: string; image: string; caption: string; depth: number };
const KINDS = [
  { value: "nav", label: "Navigation" }, { value: "hero", label: "Accueil" }, { value: "section", label: "Section de contenu" },
  { value: "footer", label: "Pied de page" }, { value: "tablet", label: "Tablette" }, { value: "mobile", label: "Mobile (placé devant)" }, { value: "autre", label: "Autre" },
];
const bd = { borderColor: "rgb(242 239 233 / .16)" };

/** Éditeur des plans de la vue éclatée : trois modes d'ajout (lien, fichiers, manuel), réordonnancement, légendes. */
export function PlanesEditor({ value, onChange, url, title, onMeta, pickImage, onCapture, capturing }: {
  onCapture?: () => void; capturing?: boolean;
  value: PlaneV[]; onChange: (v: PlaneV[]) => void; url: string; title: string;
  onMeta: (m: Record<string, unknown>) => void; pickImage: (cb: (u: string) => void) => void;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const upd = (i: number, k: keyof PlaneV, x: string | number) => onChange(value.map((p, n) => (n === i ? { ...p, [k]: x } : p)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const c = [...value]; [c[i], c[j]] = [c[j], c[i]]; onChange(c); };

  function capture() {
    setMsg(null);
    if (value.length && !confirm("La capture remplace les plans actuels. Continuer ?")) return;
    start(async () => {
      const r = await captureProject(url, title);
      if (!r.ok) return setMsg({ ok: false, t: r.error });
      onChange(r.planes); onMeta(r.meta as unknown as Record<string, unknown>);
      setMsg({ ok: true, t: `${r.planes.length} plans capturés. Relisez les noms et légendes, puis enregistrez.` });
    });
  }
  function importFiles(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    fd.set("title", title || "projet");
    Array.from(files).forEach((f) => fd.append("files", f));
    start(async () => {
      const r = await importPlaneImages(fd);
      if (!r.ok) return setMsg({ ok: false, t: r.error });
      onChange([...value, ...r.planes.map((p, k) => ({ ...p, depth: value.length + k }))]);
      setMsg({ ok: true, t: `${r.planes.length} image(s) ajoutée(s) : choisissez le type de chaque plan.` });
      if (file.current) file.current.value = "";
    });
  }

  return (
    <fieldset>
      <legend className="label">Plans de la vue éclatée 3D</legend>
      <p className="muted mb-4 text-[0.85rem]">Ordre = du fond vers l&apos;avant. Un plan « Mobile » est placé devant sur un téléphone. Texte alternatif et légende sont lus par les moteurs et les lecteurs d&apos;écran.</p>
      <div className="mb-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" disabled={pending || capturing || !url} onClick={onCapture ?? capture} title={url ? "" : "Renseignez d'abord l'URL du site"}>{pending || capturing ? "Traitement…" : "A · Capturer depuis l'URL"}</button>
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" disabled={pending} onClick={() => file.current?.click()}>B · Importer des images</button>
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => pickImage((u) => onChange([...value, { id: `m${Date.now().toString(36)}`, name: "Nouveau plan", kind: "section", image: u, caption: "", depth: value.length }]))}>C · Plan manuel (médiathèque)</button>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple className="sr-only" aria-label="Importer des images" onChange={(e) => importFiles(e.target.files)} />
      </div>
      {!url && <p className="muted mb-3 text-[0.8rem]">La capture automatique utilise le champ « URL du site » ci-dessus.</p>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl border p-3 text-sm ${msg.ok ? "acc acc-border" : "err"}`}>{msg.t}</p>}
      <ol className="space-y-3">
        {value.map((p, i) => (
          <li key={p.id} className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[120px_1fr]" style={bd}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="h-24 w-full rounded-lg border object-cover object-top sm:w-[120px]" style={bd} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor={`pl-n-${i}`}>Nom du plan</label><input id={`pl-n-${i}`} className="field" value={p.name} onChange={(e) => upd(i, "name", e.target.value)} /></div>
              <div><label className="label" htmlFor={`pl-k-${i}`}>Type</label><select id={`pl-k-${i}`} className="field" value={p.kind} onChange={(e) => upd(i, "kind", e.target.value)}>{KINDS.map((k) => (<option key={k.value} value={k.value} className="text-black">{k.label}</option>))}</select></div>
              <div className="sm:col-span-2"><label className="label" htmlFor={`pl-c-${i}`}>Légende (rôle de la section, choix de conception)</label><textarea id={`pl-c-${i}`} rows={2} className="field" maxLength={500} value={p.caption} onChange={(e) => upd(i, "caption", e.target.value)} /></div>
              <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                <button type="button" className="muted underline" onClick={() => move(i, -1)}>↑ Vers le fond</button>
                <button type="button" className="muted underline" onClick={() => move(i, 1)}>↓ Vers l&apos;avant</button>
                <button type="button" className="muted underline" onClick={() => pickImage((u) => upd(i, "image", u))}>Remplacer l&apos;image</button>
                <button type="button" className="err ml-auto underline" onClick={() => onChange(value.filter((_, k) => k !== i))}>Supprimer</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {!value.length && <p className="muted rounded-xl border p-6 text-center text-sm" style={bd}>Aucun plan : la fiche s&apos;affiche avec sa couverture seule. Ajoutez des plans pour activer la vue éclatée.</p>}
    </fieldset>
  );
}

/** Données issues de la capture, en lecture seule (jamais saisies à la main : elles ne sont pas inventées). */
export function MetaView({ meta, onClear }: { meta: Record<string, unknown>; onClear: () => void }) {
  const lh = meta.lighthouse as { performance: number; accessibility: number; bestPractices: number; seo: number; source: string } | null | undefined;
  if (!meta.capturedAt) return null;
  return (
    <div className="rounded-xl border p-4 text-sm" style={bd}>
      <p className="label">Données mesurées lors de la capture ({new Date(String(meta.capturedAt)).toLocaleDateString("fr-FR")})</p>
      <ul className="muted space-y-1">
        <li>Titre : {String(meta.title || "—")}</li>
        <li>H1 : {(meta.h1 as string[] | undefined)?.join(" · ") || "—"}</li>
        <li>Technologies détectées : {(meta.technologies as string[] | undefined)?.join(", ") || "aucune"}</li>
        <li>{lh ? `Lighthouse mobile — performance ${lh.performance}, accessibilité ${lh.accessibility}, bonnes pratiques ${lh.bestPractices}, SEO ${lh.seo}` : "Scores Lighthouse : non mesurés (le service PageSpeed n'a pas répondu)."}</li>
      </ul>
      <button type="button" className="err mt-3 underline" onClick={onClear}>Effacer ces données</button>
    </div>
  );
}

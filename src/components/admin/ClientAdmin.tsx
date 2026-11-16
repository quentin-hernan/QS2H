"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClientAdmin, deleteClientDocument, deleteClientProject, replyToClient, saveClientProject } from "@/app/admin/actions";

type Step = { name: string; status: string; note: string };
type Proj = { id: string; title: string; steps: Step[] };
type Doc = { id: string; title: string; kind: string; status: string; projectId: string | null; createdAt: string };
type Msg = { id: string; body: string; fromClient: boolean; createdAt: string };
const bd = { borderColor: "rgb(247 246 243 / .16)" };
const STATUS = [{ v: "a-venir", l: "À venir" }, { v: "en-cours", l: "En cours" }, { v: "termine", l: "Terminé" }];
const DEFAULT_STEPS: Step[] = ["Audit", "Cadrage", "Maquette", "Développement", "Recette", "Mise en ligne"].map((name) => ({ name, status: "a-venir", note: "" }));

function ProjectEditor({ clientId, p }: { clientId: string; p?: Proj }) {
  const [title, setTitle] = useState(p?.title ?? "");
  const [steps, setSteps] = useState<Step[]>(p?.steps ?? DEFAULT_STEPS);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (i: number, k: keyof Step, v: string) => setSteps(steps.map((s, n) => (n === i ? { ...s, [k]: v } : s)));
  return (
    <div className="space-y-4 border p-5" style={bd}>
      <div><label className="label" htmlFor={`pt-${p?.id ?? "new"}`}>Titre du projet</label><input id={`pt-${p?.id ?? "new"}`} className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <ul className="space-y-3">{steps.map((s, i) => (
        <li key={i} className="grid gap-2 sm:grid-cols-[1fr_150px_1.2fr_auto]">
          <input aria-label="Nom de l'étape" className="field" value={s.name} onChange={(e) => set(i, "name", e.target.value)} />
          <select aria-label="Statut" className="field" value={s.status} onChange={(e) => set(i, "status", e.target.value)}>{STATUS.map((o) => (<option key={o.v} value={o.v} className="text-black">{o.l}</option>))}</select>
          <input aria-label="Note visible par le client" placeholder="Note (visible par le client)" className="field" value={s.note} onChange={(e) => set(i, "note", e.target.value)} />
          <button type="button" className="err px-2 underline" onClick={() => setSteps(steps.filter((_, n) => n !== i))}>Retirer</button>
        </li>))}</ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 text-sm" onClick={() => setSteps([...steps, { name: "", status: "a-venir", note: "" }])}>+ Étape</button>
        <button type="button" className="btn btn-primary !min-h-[44px] !px-5 text-sm" disabled={pending} onClick={() => start(async () => { const r = await saveClientProject(clientId, p?.id ?? null, title, steps); setMsg(r.ok ? "Enregistré." : r.error || "Erreur."); if (r.ok) { router.refresh(); if (!p) { setTitle(""); setSteps(DEFAULT_STEPS); } } })}>{p ? "Enregistrer le suivi" : "Créer le suivi"}</button>
        {p && <button type="button" className="err underline" onClick={() => confirm("Supprimer ce suivi ?") && start(async () => { await deleteClientProject(clientId, p.id); router.refresh(); })}>Supprimer</button>}
        {msg && <span role="status" className="muted text-sm">{msg}</span>}
      </div>
    </div>
  );
}

function DocUpload({ clientId, projects }: { clientId: string; projects: Proj[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form ref={ref} className="grid gap-4 border p-5 sm:grid-cols-2" style={bd} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set("clientId", clientId); start(async () => { const r = await fetch("/api/admin/documents", { method: "POST", body: fd }); const j = await r.json(); setMsg({ ok: !!j.ok, t: j.ok ? "Document déposé." : j.error }); if (j.ok) { ref.current?.reset(); router.refresh(); } }); }}>
      <div><label className="label" htmlFor="dt">Titre</label><input id="dt" name="title" required className="field" /></div>
      <div><label className="label" htmlFor="dk">Type</label><select id="dk" name="kind" className="field">{["devis", "facture", "livrable", "maquette", "autre"].map((k) => (<option key={k} value={k} className="text-black">{k}</option>))}</select></div>
      <div><label className="label" htmlFor="dp">Projet (facultatif)</label><select id="dp" name="projectId" className="field"><option value="" className="text-black">—</option>{projects.map((p) => (<option key={p.id} value={p.id} className="text-black">{p.title}</option>))}</select></div>
      <div><label className="label" htmlFor="df">Fichier (PDF, PNG, JPEG, ZIP · 15 Mo)</label><input id="df" name="file" type="file" required accept="application/pdf,image/png,image/jpeg,application/zip" className="field" /></div>
      <div className="flex items-center gap-4 sm:col-span-2"><button className="btn btn-primary !min-h-[44px] !px-5 text-sm" disabled={pending}>{pending ? "Envoi…" : "Déposer le document"}</button>{msg && <span role={msg.ok ? "status" : "alert"} className={msg.ok ? "acc" : "err"}>{msg.t}</span>}</div>
    </form>
  );
}

export function ClientAdmin({ clientId, isOwner, projects, documents, messages }: { clientId: string; isOwner: boolean; projects: Proj[]; documents: Doc[]; messages: Msg[] }) {
  const [reply, setReply] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-14">
      <section><h2 className="eyebrow mb-4">Suivi de projet</h2><div className="space-y-4">{projects.map((p) => (<ProjectEditor key={p.id} clientId={clientId} p={p} />))}<ProjectEditor clientId={clientId} /></div></section>
      <section>
        <h2 className="eyebrow mb-4">Documents</h2>
        <ul className="mb-5 space-y-2 text-sm">{documents.map((d) => (<li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-2" style={bd}><span>{d.title} <span className="muted">· {d.kind}{d.status ? ` · ${d.status}` : ""} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</span></span><button type="button" className="err underline" onClick={() => confirm("Supprimer ce document ?") && start(async () => { await deleteClientDocument(clientId, d.id); router.refresh(); })}>Supprimer</button></li>))}{!documents.length && <li className="muted">Aucun document.</li>}</ul>
        <DocUpload clientId={clientId} projects={projects} />
      </section>
      <section>
        <h2 className="eyebrow mb-4">Messagerie</h2>
        <ol className="mb-5 max-w-2xl space-y-3">{messages.map((m) => (<li key={m.id} className={`border p-3 text-sm ${m.fromClient ? "" : "ml-8 bg-white/5"}`} style={bd}><p className="muted mb-1 text-xs">{m.fromClient ? "Client" : "QS2H"} · {new Date(m.createdAt).toLocaleString("fr-FR")}</p><p className="whitespace-pre-wrap">{m.body}</p></li>))}{!messages.length && <li className="muted">Aucun message.</li>}</ol>
        <div className="max-w-2xl space-y-3"><label className="label" htmlFor="rp">Répondre</label><textarea id="rp" rows={3} className="field" value={reply} onChange={(e) => setReply(e.target.value)} />{err && <p role="alert" className="err">{err}</p>}<button type="button" className="btn btn-primary !min-h-[44px] !px-5 text-sm" disabled={pending || !reply.trim()} onClick={() => start(async () => { const r = await replyToClient(clientId, reply); if (r.ok) { setReply(""); setErr(""); router.refresh(); } else setErr(r.error || "Erreur."); })}>Envoyer (le client est prévenu par email)</button></div>
      </section>
      {isOwner && (
        <section><h2 className="eyebrow mb-4">Droit à l&apos;effacement</h2><p className="muted mb-4 max-w-prose text-sm">Supprime le compte, les messages, les demandes et les documents. Les factures sont conservées 10 ans, dissociées du compte.</p><button type="button" className="btn btn-ghost" onClick={() => confirm("Supprimer définitivement ce compte client ?") && start(async () => { await deleteClientAdmin(clientId); router.push("/admin/clients"); })}>Supprimer ce compte client</button></section>
      )}
    </div>
  );
}

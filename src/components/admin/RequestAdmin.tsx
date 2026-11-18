"use client";
import { useState, useTransition } from "react";
import { updateClientRequest } from "@/app/admin/actions";

type Req = { id: string; title: string; details: string; priority: string; status: string; reply: string; createdAt: string; project?: string };
const ring = { borderColor: "rgb(242 239 233 / .16)" } as const;

/** Admin : traiter les demandes de modification d'un client (statut + réponse, le client est prévenu par email). */
export function RequestAdmin({ items }: { items: Req[] }) {
  return (
    <section>
      <h2 className="eyebrow mb-4">Demandes de modification</h2>
      {items.length === 0 ? <p className="muted">Aucune demande.</p> : <ul className="space-y-3">{items.map((r) => <Row key={r.id} r={r} />)}</ul>}
    </section>
  );
}
function Row({ r }: { r: Req }) {
  const [status, setStatus] = useState(r.status);
  const [reply, setReply] = useState(r.reply);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <li className="rounded-2xl border p-5" style={ring}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-medium">{r.title}</p><p className="muted text-sm">{new Date(r.createdAt).toLocaleDateString("fr-FR")}{r.project ? ` · ${r.project}` : ""} · priorité {r.priority}</p></div>
        <select aria-label="Statut" className="field !w-auto !py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="nouvelle">Reçue</option><option value="en cours">En cours</option><option value="terminée">Terminée</option>
        </select>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[0.95rem]">{r.details}</p>
      <label className="label mt-4" htmlFor={`rp-${r.id}`}>Réponse au client (facultatif)</label>
      <textarea id={`rp-${r.id}`} rows={3} className="field" value={reply} onChange={(e) => setReply(e.target.value)} />
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="btn btn-primary !min-h-[40px] !px-4 !py-2 text-sm" disabled={pending} onClick={() => start(async () => { const x = await updateClientRequest(r.id, status, reply); setMsg(x.ok ? "Enregistré, client prévenu par email." : x.error || "Erreur"); })}>Enregistrer</button>
        {msg && <span role="status" className="acc text-sm">{msg}</span>}
      </div>
    </li>
  );
}

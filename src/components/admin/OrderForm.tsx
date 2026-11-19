"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder, updateOrder } from "@/app/admin/shop-actions";
import { ADMIN_STATUS, ORDER_STATUSES } from "@/lib/shop";

/** Traitement d'une commande : statut, transporteur, suivi, note interne. Boutons rapides pour l'étape suivante. */
export function OrderForm({ id, status, delivery, carrier, tracking, adminNote, owner }: { id: string; status: string; delivery: string; carrier: string; tracking: string; adminNote: string; owner: boolean }) {
  const router = useRouter();
  const [st, setSt] = useState(status);
  const [car, setCar] = useState(carrier);
  const [trk, setTrk] = useState(tracking);
  const [note, setNote] = useState(adminNote);
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const save = (next = st) => start(async () => {
    const r = await updateOrder(id, { status: next, carrier: car, tracking: trk, adminNote: note, notify });
    setSt(next);
    setMsg({ ok: r.ok, text: r.ok ? r.message || "Enregistré." : r.error || "Erreur" });
    if (r.ok) router.refresh();
  });
  // action rapide : étape suivante du traitement
  const nextOf: Record<string, { to: string; label: string } | undefined> = {
    nouvelle: { to: "confirmée", label: "Valider la commande" },
    confirmée: { to: "préparation", label: "Passer en préparation" },
    préparation: { to: "expédiée", label: delivery === "retrait" ? "Prête à retirer" : "Marquer expédiée" },
    expédiée: { to: "terminée", label: delivery === "retrait" ? "Marquer retirée" : "Marquer livrée" },
  };
  const quick = nextOf[st];
  const field = "field !py-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`st-${id}`}>Statut</label>
        <select id={`st-${id}`} value={st} onChange={(e) => setSt(e.target.value)} className="field !w-auto !py-2 text-sm">
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="text-black">{ADMIN_STATUS[s]}</option>)}
        </select>
        {quick && st === status && <button type="button" className="btn btn-primary !min-h-[40px] !px-4 !py-2 text-sm" disabled={pending} onClick={() => save(quick.to)}>{quick.label}</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="muted mb-1 block">Transporteur</span><input value={car} onChange={(e) => setCar(e.target.value)} placeholder="Colissimo, Chronopost…" className={field} /></label>
        <label className="text-sm"><span className="muted mb-1 block">Numéro de suivi</span><input value={trk} onChange={(e) => setTrk(e.target.value)} className={field} /></label>
      </div>
      <label className="block text-sm"><span className="muted mb-1 block">Note interne (jamais visible du client)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={field} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Prévenir le client par email en cas de changement de statut</label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" disabled={pending} onClick={() => save()}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {owner && <button type="button" className="err text-sm underline" onClick={() => { if (confirm("Supprimer définitivement cette commande ? (le stock n'est pas remis : annulez-la plutôt)")) start(async () => { await deleteOrder(id); router.refresh(); }); }}>Supprimer</button>}
        {msg && <span role="status" className={`text-sm ${msg.ok ? "acc" : "err"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAppointment, declineAppointment } from "@/app/admin/rdv-actions";

/** Valider / refuser (ou annuler) un rendez-vous, avec un message au client. */
export function RdvActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => start(async () => {
    const r = await fn();
    setMsg({ ok: r.ok, text: r.ok ? r.message || "Enregistré." : r.error || "Erreur" });
    if (r.ok) { setAsking(false); router.refresh(); }
  });
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {status === "en attente" && <button type="button" className="btn btn-primary !min-h-[40px] !px-5 !py-2 text-sm" disabled={pending} onClick={() => run(() => confirmAppointment(id))}>Valider le créneau</button>}
        {(status === "en attente" || status === "confirmé") && !asking && <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm" onClick={() => setAsking(true)}>{status === "en attente" ? "Refuser" : "Annuler le rendez-vous"}</button>}
        {msg && <span role="status" className={`text-sm ${msg.ok ? "acc" : "err"}`}>{msg.text}</span>}
      </div>
      {asking && (
        <div className="space-y-2">
          <label className="block text-sm"><span className="muted mb-1 block">Message au client (motif, autre créneau proposé…), facultatif</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="field !py-2 text-sm" /></label>
          <div className="flex gap-3">
            <button type="button" className="btn btn-primary !min-h-[40px] !px-4 !py-2 text-sm" disabled={pending} onClick={() => run(() => declineAppointment(id, reason))}>Envoyer et {status === "en attente" ? "refuser" : "annuler"}</button>
            <button type="button" className="muted text-sm underline" onClick={() => setAsking(false)}>Retour</button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { resendVerification } from "@/app/(site)/compte/actions";

/** Rappel discret : l'espace client est accessible, la confirmation de l'adresse email peut se faire plus tard. */
export function VerifyBanner({ email }: { email: string }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div role="status" className="es-card mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-[0.95rem]">
      <p>Pensez à confirmer votre adresse <strong>{email}</strong> pour sécuriser votre compte. Vous pouvez le faire plus tard.</p>
      <span className="flex items-center gap-3">
        {msg && <span className="muted text-sm">{msg}</span>}
        <button type="button" disabled={pending} className="btn btn-outline !min-h-[40px] !px-4 !py-2 text-[0.85rem]" onClick={() => start(async () => { const r = await resendVerification(); setMsg(r.ok || r.error || ""); })}>Recevoir le lien</button>
      </span>
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLegal } from "@/app/admin/actions";
import { RichText } from "./RichText";

export function LegalEditor({ doc, initialHtml }: { doc: string; initialHtml: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [major, setMajor] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await saveLegal(doc, html, major, note); setMsg({ ok: r.ok, t: r.ok ? `Version ${r.version} publiée.${r.notified ? ` ${r.notified} client(s) prévenu(s).` : ""}` : r.error || "Erreur." }); if (r.ok) router.refresh(); }); }}>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`border p-4 ${msg.ok ? "acc acc-border" : "err"}`}>{msg.t}</p>}
      <RichText value={html} onChange={setHtml} />
      <div><label className="label" htmlFor="lg-note">Note interne sur la modification</label><input id="lg-note" className="field" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></div>
      <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={major} onChange={(e) => setMajor(e.target.checked)} /><span>Changement majeur : prévenir les clients par email</span></label>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Publication…" : "Publier une nouvelle version"}</button>
    </form>
  );
}

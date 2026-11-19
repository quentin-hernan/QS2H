"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTeamMember, deleteTeamMember, updateTeamMember } from "@/app/admin/section-actions";

type M = { id: string; name: string; role: string; bio: string };

/**
 * Gestion des collaborateurs depuis la page À propos (visible uniquement quand l'éditeur « Modifier l'apparence » est ouvert).
 * Même donnée que l'admin › Équipe : un ajout ici apparaît là-bas, et inversement. La photo se change en cliquant sur le portrait.
 */
export function TeamTools({ members }: { members: M[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); flash(r.ok ? ok : r.error || "Erreur"); if (r.ok) router.refresh(); });
  return (
    <div className="team-tools sx-skip mt-10 rounded-2xl border p-5" style={{ borderColor: "rgb(127 169 217 / .6)" }}>
      <p className="mb-1 font-semibold">Équipe : modifier ou ajouter un collaborateur</p>
      <p className="muted mb-4 text-sm">La photo se change en cliquant sur le portrait ci-dessus. Mêmes données que l&apos;admin › Équipe.</p>
      <ul className="space-y-4">
        {members.map((m) => (
          <li key={m.id} className="grid gap-2 sm:grid-cols-2">
            <form className="contents" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => updateTeamMember(m.id, { name: String(f.get("name")), role: String(f.get("role")), bio: String(f.get("bio")) }), "Collaborateur enregistré."); }}>
              <input name="name" defaultValue={m.name} aria-label="Nom" className="field !py-2" required />
              <input name="role" defaultValue={m.role} aria-label="Rôle" className="field !py-2" required />
              <textarea name="bio" defaultValue={m.bio} aria-label="Présentation" rows={2} className="field !py-2 sm:col-span-2" />
              <span className="flex gap-3 sm:col-span-2">
                <button className="btn btn-primary !min-h-[40px] !px-5 !py-2 text-sm" disabled={pending}>Enregistrer</button>
                <button type="button" className="err text-sm underline" onClick={() => { if (confirm(`Supprimer ${m.name} de l'équipe ?`)) run(() => deleteTeamMember(m.id), "Collaborateur supprimé."); }}>Supprimer</button>
              </span>
            </form>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-5 !py-2.5" disabled={pending} onClick={() => run(addTeamMember, "Collaborateur ajouté : modifiez-le ci-dessus.")}>+ Ajouter un collaborateur</button>
        {msg && <span role="status" className="acc text-sm">{msg}</span>}
      </div>
    </div>
  );
}

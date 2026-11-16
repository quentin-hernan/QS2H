import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { InviteForm, UserRow } from "@/components/admin/Misc";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Utilisateurs" };

export default async function Users() {
  const me = await requireSession("owner");
  const [users, logs] = await Promise.all([db.user.findMany({ orderBy: { createdAt: "asc" } }), db.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 })]);
  const ring = { borderColor: "rgb(242 239 233 / .14)" };
  return (
    <div className="space-y-10">
      <header><h1 className="mb-3 text-h2 font-medium">Utilisateurs</h1><p className="muted max-w-2xl"><strong>Propriétaire</strong> : accès complet (paramètres, utilisateurs, export). <strong>Éditeur</strong> : contenus, demandes, médias.</p></header>
      <InviteForm />
      <section className="overflow-x-auto rounded-2xl border p-2 md:p-4" style={ring}><table className="w-full min-w-[520px] text-left"><caption className="sr-only">Utilisateurs</caption><thead className="muted text-xs uppercase tracking-wider"><tr><th scope="col" className="p-3 font-medium">Utilisateur</th><th scope="col" className="p-3 font-medium">Rôle</th><th scope="col" className="p-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{users.map((u) => (<UserRow key={u.id} self={u.id === me.uid} u={{ id: u.id, name: u.name, email: u.email, role: u.role, pending: !!u.inviteToken }} />))}</tbody></table></section>
      <section aria-labelledby="jl"><h2 id="jl" className="mb-4 text-xl font-medium">Journal des connexions</h2>
        <ul className="rounded-2xl border text-sm" style={ring}>{logs.map((l) => (<li key={l.id} className="flex flex-wrap justify-between gap-2 border-t p-4 first:border-t-0" style={{ borderColor: "rgb(242 239 233 / .1)" }}><span>{l.email} <span className="muted">· {l.ip}</span></span><span className={l.success ? "muted" : "err"}>{l.success ? "Réussie" : "Échec"} · {formatDate(l.createdAt)} {l.createdAt.toLocaleTimeString("fr-FR")}</span></li>))}</ul></section>
    </div>
  );
}

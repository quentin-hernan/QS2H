import { requireClient } from "@/lib/client-auth";
import { PasswordForm, ProfileForm } from "@/components/ClientForms";
import { db } from "@/lib/db";

export const metadata = { title: "Mes informations" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await requireClient();
  const logins = await db.clientLogin.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" }, take: 10 });
  return (
    <div className="grid gap-16 xl:grid-cols-2">
      <section className="max-w-xl"><h2 className="eyebrow mb-6">Mes informations</h2><ProfileForm c={c} /></section>
      <section className="max-w-xl"><h2 className="eyebrow mb-6">Mot de passe</h2><PasswordForm /></section>
      <section className="xl:col-span-2">
        <h2 className="eyebrow mb-4">Journal de mes connexions</h2>
        <table className="w-full max-w-3xl text-left text-[0.92rem]">
          <thead className="muted"><tr><th className="py-2 font-medium">Date</th><th className="font-medium">Résultat</th><th className="font-medium">Réseau (tronqué)</th><th className="font-medium">Navigateur</th></tr></thead>
          <tbody className="divide-y hair">{logins.map((l) => (<tr key={l.id}><td className="py-2">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(l.createdAt)}</td><td>{l.success ? "Réussie" : "Échec"}</td><td>{l.ipTruncated || "—"}</td><td className="max-w-[28ch] truncate">{l.agent || "—"}</td></tr>))}</tbody>
        </table>
      </section>
    </div>
  );
}

import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PasswordForm, TwoFactor } from "@/components/admin/Misc";

export const metadata = { title: "Mon compte" };

export default async function Account() {
  const s = await requireSession();
  const u = await db.user.findUnique({ where: { id: s.uid }, select: { totpEnabled: true, mustChangePassword: true } });
  return (
    <div className="max-w-2xl space-y-8">
      <header><h1 className="mb-3 text-h2 font-medium">Mon compte</h1><p className="muted">{s.name} · {s.email}</p></header>
      {u?.mustChangePassword && <p role="alert" className="acc acc-border rounded-2xl border p-5">Pour votre sécurité, remplacez le mot de passe initial avant de continuer.</p>}
      <PasswordForm />
      <TwoFactor enabled={!!u?.totpEnabled} />
    </div>
  );
}

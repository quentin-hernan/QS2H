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
      {s.role === "owner" && !u?.totpEnabled && !u?.mustChangePassword && (
        <div role="alert" className="acc acc-border rounded-2xl border p-5">
          <p className="font-medium">Dernière étape avant d&apos;accéder à l&apos;administration</p>
          <p className="mt-2 text-[0.95rem]">Pour le compte propriétaire, la double authentification est obligatoire. Tant qu&apos;elle n&apos;est pas activée, les autres pages de l&apos;administration vous renvoient ici. Descendez à « Double authentification », cliquez sur « Activer la 2FA », ajoutez la clé dans une application (Google Authenticator, Authy, 1Password…), saisissez le code à 6 chiffres : vous serez redirigé vers le tableau de bord.</p>
        </div>
      )}
      <PasswordForm />
      <TwoFactor enabled={!!u?.totpEnabled} />
    </div>
  );
}

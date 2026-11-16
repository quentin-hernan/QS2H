import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { InviteAcceptForm } from "@/components/admin/Misc";

export const metadata: Metadata = { title: "Invitation — administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const u = await db.user.findUnique({ where: { inviteToken: token } });
  const valid = !!u && !!u.inviteExpires && u.inviteExpires > new Date();
  return (
    <main className="dark-section flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border p-8 md:p-10" style={{ borderColor: "rgb(242 239 233 / .14)", background: "#14171C" }}>
        <Image src="/logo-light.png" alt="QS2H" width={720} height={227} sizes="160px" className="mb-8 h-12 w-auto" />
        {valid ? (<><h1 className="mb-2 text-2xl font-medium">Bienvenue, {u!.name}</h1><p className="muted mb-6 text-sm">Choisissez votre mot de passe pour accéder à l&apos;administration.</p><InviteAcceptForm token={token} /></>) : (<><h1 className="mb-3 text-2xl font-medium">Invitation invalide</h1><p className="muted">Ce lien a expiré ou a déjà été utilisé. Demandez une nouvelle invitation au propriétaire du site.</p></>)}
      </div>
    </main>
  );
}

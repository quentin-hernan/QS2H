import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mes demandes de devis" };
export const dynamic = "force-dynamic";

/** Étapes côté client d'une demande (statut interne de l'administration → libellé et avancement). */
const FLOW: Record<string, { label: string; step: number; text: string }> = {
  nouveau: { label: "Reçue", step: 1, text: "Votre demande est bien arrivée. Nous l'étudions et revenons vers vous sous 24 heures ouvrées." },
  contacté: { label: "En cours d'étude", step: 2, text: "Nous avons pris contact avec vous et étudions votre projet." },
  "devis envoyé": { label: "Devis envoyé", step: 3, text: "Votre devis vous a été envoyé : retrouvez-le dans « Devis et factures » ou par email." },
  gagné: { label: "Accepté", step: 4, text: "Merci pour votre confiance : le projet démarre." },
  perdu: { label: "Clôturée", step: 4, text: "Cette demande est clôturée. N'hésitez pas à nous réécrire pour un nouveau projet." },
};
const STEPS = ["Reçue", "En étude", "Devis envoyé", "Terminée"];

export default async function Page() {
  const c = await requireClient();
  const leads = await db.lead.findMany({ where: { OR: [{ clientId: c.id }, ...(c.emailVerifiedAt ? [{ email: c.email }] : [])] }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-h2 font-medium">Mes demandes de devis</h1><p className="muted mt-2">Toutes vos demandes (formulaire de devis, assistant, rendez-vous) et leur avancement. Vos coordonnées sont reprises de votre compte.</p></div>
        <Link href="/contact" className="btn btn-primary !min-h-[44px] !px-5 text-sm">Nouvelle demande</Link>
      </header>
      {leads.length === 0 ? <div className="es-card p-8 text-center"><p className="muted">Aucune demande pour l&apos;instant.</p><Link href="/contact" className="btn btn-primary mt-5">Demander un devis</Link></div> : (
        <ul className="grid gap-4">
          {leads.map((l) => {
            const f = FLOW[l.status] ?? FLOW.nouveau;
            return (
              <li key={l.id} className="es-card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-semibold">{l.projectType || "Demande"}</p><p className="muted text-sm">{formatDate(l.createdAt)}{l.budget ? ` · budget ${l.budget}` : ""}{l.deadline ? ` · ${l.deadline}` : ""}</p></div>
                  <span className="es-status" data-s={f.step >= 4 ? "terminée" : "en cours"}>{f.label}</span>
                </div>
                <ol className="es-track es-track-4 my-5" aria-label="Avancement de la demande">
                  {STEPS.map((s, i) => (
                    <li key={s} className={i + 1 < f.step ? "is-done" : i + 1 === f.step ? "is-now" : ""} aria-current={i + 1 === f.step ? "step" : undefined}>
                      <span className="es-track-dot" aria-hidden="true">{i + 1 < f.step || (i + 1 === f.step && f.step === 4) ? "✓" : i + 1}</span>
                      <span className="es-track-label">{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-[0.95rem]">{f.text}</p>
                {l.message && <details className="mt-3"><summary className="cursor-pointer text-sm underline">Votre message</summary><p className="muted mt-2 whitespace-pre-wrap text-[0.95rem]">{l.message}</p></details>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

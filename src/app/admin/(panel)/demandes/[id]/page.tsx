import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LeadForm } from "@/components/admin/Misc";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Demande" };

export default async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await db.lead.findUnique({ where: { id } });
  if (!l) notFound();
  const ring = { borderColor: "rgb(242 239 233 / .14)" };
  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="muted mb-6 text-sm"><Link href="/admin/demandes" className="underline">Demandes</Link> / {l.name}</nav>
      <h1 className="mb-2 text-h2 font-medium">{l.name}</h1>
      <p className="muted mb-10">Reçue le {formatDate(l.createdAt)} · {l.source}</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-6 rounded-2xl border p-6 md:p-8" style={ring} aria-label="Détails">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div><dt className="label">Email</dt><dd><a className="acc underline" href={`mailto:${l.email}`}>{l.email}</a></dd></div>
            <div><dt className="label">Téléphone</dt><dd>{l.phone ? <a className="acc underline" href={`tel:${l.phone}`}>{l.phone}</a> : "—"}</dd></div>
            <div><dt className="label">Entreprise</dt><dd>{l.company || "—"}</dd></div>
            <div><dt className="label">Projet</dt><dd>{l.projectType}</dd></div>
            <div><dt className="label">Budget</dt><dd>{l.budget}</dd></div>
            <div><dt className="label">Délai</dt><dd>{l.deadline}</dd></div>
          </dl>
          <div><p className="label">Message</p><p className="whitespace-pre-wrap leading-relaxed">{l.message}</p></div>
          <a className="btn btn-primary" href={`mailto:${l.email}?subject=${encodeURIComponent("Votre projet de site web — QS2H")}`}>Répondre par email</a>
        </section>
        <section className="rounded-2xl border p-6 md:p-8" style={ring} aria-label="Suivi"><LeadForm id={l.id} status={l.status} notes={l.notes} /></section>
      </div>
    </div>
  );
}

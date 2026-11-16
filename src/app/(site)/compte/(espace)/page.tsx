import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { ProjectObject } from "@/components/Scenes";
import { formatDate, parseJson } from "@/lib/utils";

export const metadata = { title: "Mon espace client" };
export const dynamic = "force-dynamic";
type Step = { name: string; status: "a-venir" | "en-cours" | "termine"; note?: string };
const L: Record<string, string> = { "a-venir": "À venir", "en-cours": "En cours", termine: "Terminé" };

export default async function Page() {
  const c = await requireClient();
  const [projects, leads] = await Promise.all([
    db.clientProject.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" } }),
    db.lead.findMany({ where: { OR: [{ clientId: c.id }, { email: c.email }] }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-16">
      <section>
        <h2 className="eyebrow mb-6">Suivi de projet</h2>
        {projects.length === 0 ? (
          <p className="muted max-w-prose">Aucun projet en cours. Quand nous démarrerons ensemble, chaque étape apparaîtra ici.</p>
        ) : projects.map((p) => {
          const steps = parseJson<Step[]>(p.steps, []);
          return (
            <article key={p.id} className="mb-10">
              <h3 className="mb-5 text-h3">{p.title}</h3>
              <ProjectObject done={steps.filter((x) => x.status === "termine").length} total={Math.max(1, steps.length)} current={steps.find((x) => x.status === "en-cours")?.name} />
              <ol className="border-l hair">
                {steps.map((s, i) => (
                  <li key={i} className="relative pb-6 pl-6">
                    <span className={`absolute -left-[7px] top-1.5 h-3 w-3 border ${s.status === "termine" ? "acc-bg acc-border" : s.status === "en-cours" ? "acc-border bg-ivory" : "hair bg-ivory"}`} aria-hidden="true" />
                    <p className="font-medium">{s.name} <span className="muted ml-2 text-[0.8rem] uppercase tracking-wider">{L[s.status]}</span></p>
                    {s.note && <p className="muted text-[0.92rem]">{s.note}</p>}
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </section>
      <section>
        <h2 className="eyebrow mb-6">Mes demandes de devis</h2>
        {leads.length === 0 ? (
          <p className="muted">Aucune demande pour l&apos;instant. <Link href="/contact" className="acc underline">Demander un devis</Link></p>
        ) : (
          <ul className="divide-y hair border-y hair">
            {leads.map((l) => (<li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><span>{l.projectType || "Demande"} · {formatDate(l.createdAt)}</span><span className="muted text-[0.85rem] uppercase tracking-wider">{l.status}</span></li>))}
          </ul>
        )}
      </section>
    </div>
  );
}

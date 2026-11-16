import { requireClient } from "@/lib/client-auth";
import { RightsPanel } from "@/components/ClientForms";
import { getSettings } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mes données et mes droits" };
export const dynamic = "force-dynamic";
const K: Record<string, string> = { cgu: "Conditions d'utilisation", confidentialite: "Politique de confidentialité", newsletter: "Actualités (newsletter)", majorite: "Déclaration de majorité et d'usage professionnel" };

export default async function Page() {
  const c = await requireClient();
  const [s, consents] = await Promise.all([getSettings(), db.consent.findMany({ where: { clientId: c.id }, orderBy: { givenAt: "desc" } })]);
  return (
    <div className="space-y-14">
      <p className="muted max-w-prose">Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition et de limitation. Contact pour toute question : <a className="acc underline" href={`mailto:${s.company.dpoEmail}`}>{s.company.dpoEmail}</a>. Vous pouvez aussi saisir la CNIL.</p>
      <RightsPanel newsletter={c.newsletter} />
      <section>
        <h2 className="eyebrow mb-4">Preuves de mes consentements</h2>
        <ul className="divide-y hair border-y hair text-[0.92rem]">
          {consents.map((k) => (<li key={k.id} className="flex flex-wrap justify-between gap-2 py-3"><span>{K[k.kind] ?? k.kind}{k.docVersion ? ` · version ${k.docVersion}` : ""}</span><span className="muted">{formatDate(k.givenAt)}{k.withdrawnAt ? ` · retiré le ${formatDate(k.withdrawnAt)}` : ""}</span></li>))}
        </ul>
      </section>
    </div>
  );
}

import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { MessageForm } from "@/components/ClientForms";

export const metadata = { title: "Messagerie" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await requireClient();
  const msgs = await db.clientMessage.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "asc" } });
  await db.clientMessage.updateMany({ where: { clientId: c.id, fromClient: false, readAt: null }, data: { readAt: new Date() } });
  return (
    <div className="space-y-10">
      <h2 className="eyebrow">Messagerie</h2>
      <ol className="max-w-2xl space-y-4" aria-label="Conversation">
        {msgs.length === 0 && <li className="muted">Aucun message. Écrivez-nous ci-dessous : nous répondons sous 24 h ouvrées.</li>}
        {msgs.map((m) => (
          <li key={m.id} className={`border p-4 hair ${m.fromClient ? "ml-8" : "mr-8 bg-ivory-200"}`}>
            <p className="muted mb-1 text-[0.78rem] uppercase tracking-wider">{m.fromClient ? "Vous" : "QS2H"} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(m.createdAt)}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ol>
      <div className="max-w-2xl"><MessageForm /></div>
    </div>
  );
}

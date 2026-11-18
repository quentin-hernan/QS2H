import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { MessageForm } from "@/components/ClientForms";

export const metadata = { title: "Messagerie" };
export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Page() {
  const c = await requireClient();
  const msgs = await db.clientMessage.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "asc" } });
  await db.clientMessage.updateMany({ where: { clientId: c.id, fromClient: false, readAt: null }, data: { readAt: new Date() } });
  return (
    <div className="space-y-6">
      <header><h1 className="text-h2 font-medium">Messagerie</h1><p className="muted mt-2">Échangez directement avec l&apos;équipe QS2H. Réponse sous 24 heures ouvrées, notification par email.</p></header>
      <div className="es-card flex flex-col">
        <ol className="es-chat" aria-label="Conversation">
          {msgs.length === 0 && <li className="muted p-6 text-center">Aucun message pour l&apos;instant. Écrivez-nous ci-dessous.</li>}
          {msgs.map((m) => (
            <li key={m.id} className={m.fromClient ? "me" : "them"}>
              <div className="es-bubble"><p className="whitespace-pre-wrap">{m.body}</p></div>
              <span className="muted text-xs">{m.fromClient ? "Vous" : "QS2H"} · {fmt.format(m.createdAt)}{m.fromClient && m.readAt ? " · lu" : ""}</span>
            </li>
          ))}
        </ol>
        <div className="border-t hair p-5"><MessageForm /></div>
      </div>
    </div>
  );
}

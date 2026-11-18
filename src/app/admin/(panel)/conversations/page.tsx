import Link from "next/link";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export const metadata = { title: "Conversations de l'assistant" };

export default async function Conversations() {
  const convs = await db.chatConversation.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const ring = { borderColor: "rgb(242 239 233 / .14)" } as const;
  return (
    <div>
      <header className="mb-8"><h1 className="text-h2 font-medium">Conversations de l&apos;assistant</h1><p className="muted mt-2 max-w-prose">Messages échangés avec les visiteurs, conservés 90 jours (purge automatique par le script <code>purge-inactive</code>). Les demandes laissées via l&apos;assistant apparaissent aussi dans <Link href="/admin/demandes" className="underline">Demandes reçues</Link>. Réglages et réponses sur mesure : <Link href="/admin/pages/chatbot" className="underline">Assistant (chatbot)</Link>.</p></header>
      {convs.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={ring}>Aucune conversation.</p> : (
        <ul className="space-y-3">
          {convs.map((c) => {
            const m = parseJson<{ role: string; text: string }[]>(c.messages, []);
            return (
              <li key={c.id}>
                <details className="rounded-2xl border p-5" style={ring}>
                  <summary className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium">{m.find((x) => x.role === "user")?.text.slice(0, 90) || "Conversation vide"}</span>
                    <span className="muted text-sm">{c.updatedAt.toLocaleString("fr-FR")} · {m.filter((x) => x.role === "user").length} message(s) · {c.page || "—"}{c.handoff ? " · demande laissée" : ""}</span>
                  </summary>
                  <ol className="mt-4 space-y-2 text-[0.95rem]">{m.map((x, i) => (<li key={i}><span className={x.role === "user" ? "acc font-medium" : "muted font-medium"}>{x.role === "user" ? "Visiteur" : "Assistant"} : </span>{x.text}</li>))}</ol>
                  {c.leadId && <p className="mt-4"><Link href={`/admin/demandes/${c.leadId}`} className="acc underline">Voir la demande associée</Link></p>}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

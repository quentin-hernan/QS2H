import { requireClient } from "@/lib/client-auth";
import { db } from "@/lib/db";
import { logoutClient } from "../actions";
import { EspaceNav } from "@/components/EspaceNav";

/** Espace client : coque d'application (navigation latérale, compteurs) partagée par toutes les pages du compte. */
export default async function Espace({ children }: { children: React.ReactNode }) {
  const c = await requireClient();
  const [unread, toValidate, openReq] = await Promise.all([
    db.clientMessage.count({ where: { clientId: c.id, fromClient: false, readAt: null } }),
    db.clientDocument.count({ where: { clientId: c.id, kind: "maquette", status: "" } }),
    db.clientRequest.count({ where: { clientId: c.id, status: { not: "terminée" } } }),
  ]);
  const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
  return (
    <section className="espace light-section pb-20 pt-24 md:pt-28" aria-label="Espace client">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="es-card mb-4 flex items-center gap-4 p-5">
              <span className="es-avatar" aria-hidden="true">{initials}</span>
              <span className="min-w-0"><span className="block truncate font-semibold">{c.firstName} {c.lastName}</span><span className="muted block truncate text-sm">{c.company || c.email}</span></span>
            </div>
            <EspaceNav badges={{ "/compte/messages": unread, "/compte/documents": toValidate, "/compte/demandes": openReq }} />
            <form action={logoutClient} className="mt-4 hidden lg:block"><button className="muted px-4 text-sm underline">Me déconnecter</button></form>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

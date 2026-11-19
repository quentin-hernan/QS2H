import { requireClient } from "@/lib/client-auth";
import { db } from "@/lib/db";
import { logoutClient } from "../actions";
import { EspaceNav } from "@/components/EspaceNav";
import { VerifyBanner } from "@/components/VerifyBanner";
import { NoticeBell } from "@/components/NoticeBell";
import { AutoRefresh } from "@/components/AutoRefresh";

/** Espace client : coque d'application (navigation latérale, compteurs) partagée par toutes les pages du compte. */
export default async function Espace({ children }: { children: React.ReactNode }) {
  const c = await requireClient();
  const [unread, toValidate, openReq, openOrders] = await Promise.all([
    db.clientMessage.count({ where: { clientId: c.id, fromClient: false, readAt: null } }),
    db.clientDocument.count({ where: { clientId: c.id, kind: "maquette", status: "" } }),
    db.clientRequest.count({ where: { clientId: c.id, status: { not: "terminée" } } }),
    db.shopOrder.count({ where: { clientId: c.id, status: { notIn: ["terminée", "annulée"] } } }),
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
              <span className="ml-auto"><NoticeBell endpoint="/api/compte/notices" label="Mes notifications" /><AutoRefresh /></span>
            </div>
            <EspaceNav badges={{ "/compte/messages": unread, "/compte/documents": toValidate, "/compte/demandes": openReq, "/compte/commandes": openOrders }} />
            <form action={logoutClient} className="mt-4 hidden lg:block"><button className="muted px-4 text-sm underline">Me déconnecter</button></form>
          </aside>
          <div className="min-w-0">{!c.emailVerifiedAt && <VerifyBanner email={c.email} />}{children}</div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDate, parseJson } from "@/lib/utils";
import { ADMIN_STATUS, money, type OrderHistory, type OrderLine } from "@/lib/shop";
import { OrderForm } from "@/components/admin/OrderForm";

export const metadata = { title: "Commandes boutique" };
export const dynamic = "force-dynamic";
const line = { borderColor: "rgb(242 239 233 / .14)" } as const;

const TABS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: "traiter", label: "À traiter", statuses: ["nouvelle"] },
  { key: "cours", label: "En cours", statuses: ["confirmée", "préparation"] },
  { key: "expediees", label: "Expédiées", statuses: ["expédiée"] },
  { key: "terminees", label: "Terminées", statuses: ["terminée"] },
  { key: "annulees", label: "Annulées", statuses: ["annulée"] },
  { key: "toutes", label: "Toutes", statuses: null },
];
const dt = (d: string | Date) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function Orders({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const tab = TABS.find((t) => t.key === vue) ?? TABS[0];
  const [session, all] = await Promise.all([getSession(), db.shopOrder.findMany({ orderBy: { createdAt: "desc" }, take: 500 })]);
  const count = (t: (typeof TABS)[number]) => (t.statuses ? all.filter((o) => t.statuses!.includes(o.status)).length : all.length);
  const orders = tab.statuses ? all.filter((o) => tab.statuses!.includes(o.status)) : all;
  const owner = session?.role === "owner";
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-h2 font-medium">Commandes boutique</h1>
        <p className="muted mt-2 max-w-2xl">Chaque commande vient d&apos;un compte client et reste suivie dans son espace. Validez-la, passez-la en préparation, puis indiquez l&apos;expédition : le client est prévenu par email à chaque étape. Aucun paiement n&apos;est encaissé sur le site : envoyez la facture après confirmation.</p>
      </header>
      <nav aria-label="Filtrer les commandes" className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = count(t);
          const on = t.key === tab.key;
          return (
            <Link key={t.key} href={`/admin/commandes?vue=${t.key}`} aria-current={on ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm ${on ? "bg-white/10 font-medium" : "hover:bg-white/5"}`} style={line}>
              {t.label} <span className={t.key === "traiter" && n > 0 ? "acc font-semibold" : "muted"}>({n})</span>
            </Link>
          );
        })}
      </nav>
      {orders.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={line}>Aucune commande dans « {tab.label} ».</p> : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const items = parseJson<OrderLine[]>(o.items, []);
            const hist = parseJson<OrderHistory>(o.history, []);
            return (
              <li key={o.id} className="rounded-2xl border" style={line}>
                <details open={o.status === "nouvelle"}>
                  <summary className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <span><strong>{o.number}</strong> <span className="muted">· {o.name}{o.company ? ` (${o.company})` : ""} · {formatDate(o.createdAt)}</span></span>
                    <span className="flex items-center gap-4"><span className={o.status === "nouvelle" ? "acc font-semibold" : "muted"}>{ADMIN_STATUS[o.status] ?? o.status}</span><strong>{money(o.total)}</strong></span>
                  </summary>
                  <div className="grid gap-8 border-t p-5 md:grid-cols-2" style={line}>
                    <div className="space-y-4 text-[0.95rem]">
                      <div className="space-y-1">
                        <p className="font-medium">{o.name}</p>
                        <p><a className="underline" href={`mailto:${o.email}`}>{o.email}</a>{o.phone && <> · <a className="underline" href={`tel:${o.phone}`}>{o.phone}</a></>}</p>
                        {o.clientId ? <p><Link className="acc underline" href={`/admin/clients/${o.clientId}`}>Voir la fiche client →</Link></p> : <p className="muted text-sm">Commande passée avant la création de comptes obligatoires.</p>}
                      </div>
                      <div>
                        <p className="muted text-xs uppercase tracking-[0.12em]">{o.delivery === "retrait" ? "Retrait à La Rochelle" : "Livraison"}</p>
                        {o.delivery === "livraison" && <p>{o.address}<br />{o.zip} {o.city}</p>}
                      </div>
                      {o.note && <div><p className="muted text-xs uppercase tracking-[0.12em]">Précision du client</p><p className="whitespace-pre-wrap">{o.note}</p></div>}
                      <div>
                        <p className="muted mb-1 text-xs uppercase tracking-[0.12em]">Articles</p>
                        <ul className="space-y-1">{items.map((l) => (<li key={l.slug} className="flex justify-between gap-4"><span>{l.title} × {l.qty}</span><span>{money(l.price * l.qty)}</span></li>))}</ul>
                        <p className="mt-2 flex justify-between border-t pt-2 font-semibold" style={line}><span>Total TTC</span><span>{money(o.total)}</span></p>
                      </div>
                      {hist.length > 0 && (
                        <div><p className="muted mb-1 text-xs uppercase tracking-[0.12em]">Historique</p>
                          <ol className="muted space-y-0.5 text-sm">{hist.map((h, i) => (<li key={i}>{dt(h.at)} · {ADMIN_STATUS[h.status] ?? h.status}</li>))}</ol>
                        </div>
                      )}
                      <p className="muted text-xs">CGV boutique acceptées (version {o.cgvVersion || "—"}).</p>
                    </div>
                    <OrderForm id={o.id} status={o.status} delivery={o.delivery} carrier={o.carrier} tracking={o.tracking} adminNote={o.adminNote} owner={owner} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

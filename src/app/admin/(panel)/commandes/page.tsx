import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUSES, money, type OrderLine } from "@/lib/shop";
import { setOrderStatus } from "@/app/admin/shop-actions";

export const metadata = { title: "Commandes boutique" };
const line = { borderColor: "rgb(242 239 233 / .14)" } as const;

export default async function Orders() {
  const orders = await db.shopOrder.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <header className="mb-8"><h1 className="text-h2 font-medium">Commandes boutique</h1><p className="muted mt-2">Commandes passées sur /boutique. Aucun paiement n&apos;a été encaissé : confirmez, puis envoyez la facture.</p></header>
      {orders.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={line}>Aucune commande pour l&apos;instant.</p> : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const items = JSON.parse(o.items || "[]") as OrderLine[];
            return (
              <li key={o.id} className="rounded-2xl border" style={line}>
                <details>
                  <summary className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <span><strong>{o.number}</strong> <span className="muted">· {o.name}{o.company ? ` (${o.company})` : ""} · {formatDate(o.createdAt)}</span></span>
                    <span className="flex items-center gap-4"><span className={o.status === "nouvelle" ? "acc" : "muted"}>{o.status}</span><strong>{money(o.total)}</strong></span>
                  </summary>
                  <div className="grid gap-6 border-t p-5 md:grid-cols-2" style={line}>
                    <div className="space-y-1 text-[0.95rem]">
                      <p><a className="underline" href={`mailto:${o.email}`}>{o.email}</a>{o.phone && <> · <a className="underline" href={`tel:${o.phone}`}>{o.phone}</a></>}</p>
                      <p className="muted">{o.delivery === "retrait" ? "Retrait sur place" : `${o.address}, ${o.zip} ${o.city}`}</p>
                      {o.note && <p className="mt-3 whitespace-pre-wrap">{o.note}</p>}
                    </div>
                    <div>
                      <ul className="space-y-1 text-[0.95rem]">{items.map((l) => (<li key={l.slug} className="flex justify-between gap-4"><span>{l.title} × {l.qty}</span><span>{money(l.price * l.qty)}</span></li>))}</ul>
                      <form action={async (fd: FormData) => { "use server"; await setOrderStatus(o.id, String(fd.get("status"))); }} className="mt-5 flex items-center gap-3">
                        <label className="sr-only" htmlFor={`st-${o.id}`}>Statut</label>
                        <select id={`st-${o.id}`} name="status" defaultValue={o.status} className="field !w-auto !py-2">{ORDER_STATUSES.map((s) => <option key={s} value={s} className="text-black">{s}</option>)}</select>
                        <button className="btn btn-ghost !min-h-[40px] !px-4 !py-2 text-sm">Mettre à jour</button>
                      </form>
                    </div>
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

import Link from "next/link";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/client-auth";
import { formatDate, parseJson } from "@/lib/utils";
import { clientSteps, money, stepIndex, type OrderHistory, type OrderLine } from "@/lib/shop";

export const metadata = { title: "Mes commandes" };
export const dynamic = "force-dynamic";

const day = (d: string | Date) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Suivi d'une commande façon marketplace : bande d'étapes (reçue, confirmée, en préparation, expédiée, livrée). */
function Tracker({ status, delivery, history }: { status: string; delivery: string; history: OrderHistory }) {
  const steps = clientSteps(delivery);
  const idx = stepIndex(status);
  if (status === "annulée") return <p className="es-cancel" role="status">Cette commande a été annulée.</p>;
  const when = (k: string) => { const h = [...history].reverse().find((x) => x.status === k); return h ? day(h.at) : ""; };
  return (
    <ol className="es-track" aria-label="Suivi de la commande">
      {steps.map((s, i) => (
        <li key={s.key} className={i < idx ? "is-done" : i === idx ? "is-now" : ""} aria-current={i === idx ? "step" : undefined}>
          <span className="es-track-dot" aria-hidden="true">{i < idx || (i === idx && status === "terminée") ? "✓" : i + 1}</span>
          <span className="es-track-label">{s.label}</span>
          <span className="es-track-date">{when(s.key)}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function Page() {
  const c = await requireClient();
  const orders = await db.shopOrder.findMany({ where: { clientId: c.id }, orderBy: { createdAt: "desc" } });
  const open = orders.filter((o) => o.status !== "terminée" && o.status !== "annulée");
  const past = orders.filter((o) => o.status === "terminée" || o.status === "annulée");
  const Card = ({ o }: { o: (typeof orders)[number] }) => {
    const items = parseJson<OrderLine[]>(o.items, []);
    const hist = parseJson<OrderHistory>(o.history, []);
    return (
      <li className="es-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="font-semibold">Commande {o.number}</p><p className="muted text-sm">Passée le {formatDate(o.createdAt)} · {o.delivery === "retrait" ? "Retrait à La Rochelle" : "Livraison"}</p></div>
          <p className="text-lg font-semibold">{money(o.total)}</p>
        </div>
        <div className="my-6"><Tracker status={o.status} delivery={o.delivery} history={hist} /></div>
        {o.status === "nouvelle" && <p className="muted text-sm">Nous vérifions la disponibilité et validons votre commande rapidement ; vous recevrez la facture par email. Aucun paiement n&apos;a été demandé.</p>}
        {o.status === "expédiée" && (o.carrier || o.tracking) && <p className="text-sm"><strong>Suivi du colis</strong> : {o.carrier || "Transporteur"}{o.tracking ? ` · n° ${o.tracking}` : ""}</p>}
        {o.status === "expédiée" && o.delivery === "retrait" && <p className="text-sm">Votre commande est prête : nous vous contactons pour fixer le rendez-vous de retrait.</p>}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm underline">Détail de la commande</summary>
          <ul className="mt-3 space-y-1 text-[0.95rem]">{items.map((l) => (<li key={l.slug} className="flex justify-between gap-4"><span>{l.title} × {l.qty}</span><span>{money(l.price * l.qty)}</span></li>))}</ul>
          {o.delivery === "livraison" && <p className="muted mt-3 text-sm">Livraison : {o.address}, {o.zip} {o.city}</p>}
        </details>
      </li>
    );
  };
  return (
    <div className="space-y-10">
      <header><h1 className="text-h2 font-medium">Mes commandes</h1><p className="muted mt-2">Suivez vos achats de la boutique, de la confirmation à la livraison. Une question ? <Link href="/compte/messages" className="link-u">Écrivez-nous</Link>.</p></header>
      {orders.length === 0 ? (
        <div className="es-card p-8 text-center"><p className="muted">Vous n&apos;avez pas encore passé de commande.</p><Link href="/boutique" className="btn btn-primary mt-5">Découvrir la boutique</Link></div>
      ) : (
        <>
          <section aria-labelledby="open-h"><h2 id="open-h" className="mb-4 text-lg font-semibold">Commandes en cours ({open.length})</h2>
            {open.length ? <ul className="grid gap-4">{open.map((o) => <Card key={o.id} o={o} />)}</ul> : <div className="es-card p-6"><p className="muted">Aucune commande en cours.</p></div>}
          </section>
          {past.length > 0 && <section aria-labelledby="past-h"><h2 id="past-h" className="mb-4 text-lg font-semibold">Commandes terminées ou annulées</h2><ul className="grid gap-4">{past.map((o) => <Card key={o.id} o={o} />)}</ul></section>}
        </>
      )}
    </div>
  );
}

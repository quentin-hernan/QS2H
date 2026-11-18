import Link from "next/link";

export const metadata = { title: "Commande envoyée", robots: { index: false } };

export default async function Merci({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  return (
    <section className="light-section flex min-h-[80vh] items-center pb-24 pt-32">
      <div className="container max-w-2xl text-center">
        <p className="eyebrow justify-center">Commande envoyée</p>
        <h1 className="mt-6 text-h1 font-medium">Merci, c&apos;est noté.</h1>
        {n && <p className="mt-6 text-lg">Votre numéro de commande : <strong>{n.slice(0, 40)}</strong></p>}
        <p className="muted mt-4 leading-relaxed">Un email récapitulatif vient de vous être envoyé. Nous vérifions la disponibilité et revenons vers vous rapidement avec la confirmation et la facture. Aucun paiement n&apos;a été demandé.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3"><Link href="/boutique" className="btn btn-primary">Retour à la boutique</Link><Link href="/" className="btn btn-ghost">Accueil</Link></div>
      </div>
    </section>
  );
}

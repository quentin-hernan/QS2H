import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { SentLaptop } from "@/components/Scenes";
import { Conversion } from "@/components/Conversion";

export const metadata = buildMetadata({ title: "Demande envoyée", description: "Votre demande de devis a bien été envoyée.", path: "/contact/merci", noindex: true });

export default function Merci() {
  return (
    <section className="dark-section flex min-h-screen items-center pb-20 pt-40">
      <Conversion event="Devis envoyé" />
      <div className="container grid items-center gap-14 lg:grid-cols-2">
        <div>
        <p className="eyebrow mb-7">Demande envoyée</p>
        <h1 className="max-w-[16ch] text-h1 font-medium">Merci, <span className="serif-it">c&apos;est reçu.</span></h1>
        <p className="muted mt-8 max-w-lg text-[1.15rem] leading-relaxed">Nous étudions votre projet et revenons vers vous sous 24 heures ouvrées avec une première estimation. Un email de confirmation vient de vous être envoyé.</p>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/realisations" className="btn btn-primary">Voir nos réalisations</Link><Link href="/blog" className="btn btn-ghost">Lire le blog</Link></div>
        </div>
        <div className="hidden lg:block"><SentLaptop /></div>
      </div>
    </section>
  );
}

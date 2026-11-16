import Link from "next/link";

export default function NotFound() {
  return (
    <section className="dark-section flex min-h-screen items-center pb-20 pt-40">
      <div className="container">
        <p className="eyebrow mb-7">Erreur 404</p>
        <h1 className="text-display max-w-[12ch] font-medium">Page <span className="serif-it">introuvable.</span></h1>
        <p className="muted mt-8 max-w-md text-[1.15rem] leading-relaxed">Cette adresse n&apos;existe pas ou a été déplacée. Voici où aller depuis ici.</p>
        <ul className="mt-10 flex flex-wrap gap-3">
          <li><Link href="/" className="btn btn-primary">Accueil</Link></li>
          <li><Link href="/services" className="btn btn-ghost">Services</Link></li>
          <li><Link href="/realisations" className="btn btn-ghost">Réalisations</Link></li>
          <li><Link href="/contact" className="btn btn-ghost">Contact</Link></li>
        </ul>
      </div>
    </section>
  );
}

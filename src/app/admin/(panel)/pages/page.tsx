import Link from "next/link";
import { pageSchemas } from "@/lib/defaults";

export const metadata = { title: "Pages et textes" };

export default function Pages() {
  return (
    <div>
      <h1 className="mb-3 text-h2 font-medium">Pages et textes</h1>
      <p className="muted mb-10 max-w-2xl">Modifiez les textes de l&apos;accueil, de la méthode et de la page À propos. Chaque enregistrement crée un point de restauration. Les autres textes (services, tarifs, FAQ…) se modifient dans leur rubrique.</p>
      <ul className="grid gap-4 md:grid-cols-3">
        {pageSchemas.map((p) => (<li key={p.key}><Link href={`/admin/pages/${p.key}`} className="block rounded-2xl border p-6 transition-colors hover:bg-white/5" style={{ borderColor: "rgb(242 239 233 / .14)" }}><span className="text-xl font-medium">{p.label}</span><span className="muted mt-2 block text-sm">{p.fields.length} blocs de texte</span></Link></li>))}
        <li><Link href="/admin/parametres" className="block rounded-2xl border p-6 transition-colors hover:bg-white/5" style={{ borderColor: "rgb(242 239 233 / .14)" }}><span className="text-xl font-medium">Pages légales</span><span className="muted mt-2 block text-sm">Générées depuis les informations de l&apos;entreprise (Paramètres).</span></Link></li>
      </ul>
    </div>
  );
}

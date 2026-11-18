import Link from "next/link";
import { db } from "@/lib/db";
import { createCustomPage } from "@/app/admin/page-actions";

export const metadata = { title: "Pages libres" };

export default async function PagesLibres({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const [{ erreur }, pages] = await Promise.all([searchParams, db.customPage.findMany({ orderBy: { updatedAt: "desc" } })]);
  const ring = { borderColor: "rgb(242 239 233 / .14)" } as const;
  return (
    <div>
      <h1 className="mb-3 text-h2 font-medium">Pages libres</h1>
      <p className="muted mb-10 max-w-2xl">Créez de nouvelles pages (offre, promotion, page produit, partenaire…) en assemblant des sections : bandeau, texte, image ou vidéo 16:9, colonnes, questions, appel à l&apos;action. Glissez les sections pour les réordonner, prévisualisez en ordinateur, tablette ou mobile, puis publiez.</p>
      <form action={createCustomPage} className="mb-10 flex flex-wrap items-end gap-3 rounded-2xl border p-5" style={ring}>
        <div className="min-w-[260px] flex-1"><label className="label" htmlFor="np-title">Titre de la nouvelle page</label><input id="np-title" name="title" required maxLength={120} className="field" placeholder="Ex. Licences bureautiques" /></div>
        <button className="btn btn-primary">Créer la page</button>
        {erreur && <p role="alert" className="err w-full">Indiquez un titre.</p>}
      </form>
      {pages.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={ring}>Aucune page libre.</p> : (
        <ul className="grid gap-3">
          {pages.map((p) => (
            <li key={p.id}><Link href={`/admin/pages-libres/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 transition-colors hover:bg-white/5" style={ring}>
              <span><span className="block text-lg font-medium">{p.title}</span><span className="muted text-sm">/{p.slug}</span></span>
              <span className={p.published ? "acc text-sm" : "muted text-sm"}>{p.published ? "Publiée" : "Brouillon"} · modifiée le {p.updatedAt.toLocaleDateString("fr-FR")}</span>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}

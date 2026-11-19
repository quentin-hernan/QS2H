import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { parseJson } from "@/lib/utils";
import { OverridesAdmin } from "@/components/admin/OverridesAdmin";
import type { OverridesMap } from "@/lib/overrides";

export const dynamic = "force-dynamic";

export const metadata = { title: "Apparence des pages" };

const PAGES: [string, string][] = [["/", "Accueil"], ["/services", "Services"], ["/tarifs", "Tarifs"], ["/methode", "Méthode"], ["/a-propos", "À propos"], ["/blog", "Blog"], ["/faq", "FAQ"], ["/contact", "Contact"], ["/rendez-vous", "Rendez-vous"], ["/realisations", "Réalisations"], ["/catalogue", "Catalogue"], ["/boutique", "Boutique"], ["/devis", "Devis"]];

export default async function Apparence() {
  const [s, custom, ovRow, slotRow] = await Promise.all([getSettings(), db.customPage.findMany({ where: { published: true }, select: { slug: true, title: true } }), db.setting.findUnique({ where: { key: "overrides" } }), db.setting.findUnique({ where: { key: "slots" } })]);
  const styles = s.sectionStyles ?? {};
  const all: [string, string][] = [...PAGES, ...custom.map((p) => [`/${p.slug}`, p.title] as [string, string])];
  const ring = { borderColor: "rgb(242 239 233 / .14)" } as const;
  return (
    <div>
      <h1 className="mb-3 text-h2 font-medium">Apparence des pages</h1>
      <p className="muted mb-4 max-w-2xl">Modifiez le fond et les animations de n&apos;importe quelle section de n&apos;importe quelle page, directement sur le site : image, vidéo, couleur ou dégradé (en pleine section ou en bande verticale / horizontale), voile pour la lisibilité, parallaxe, zoom lent, animation d&apos;apparition (fondu, montée, glissement, zoom, flou), espacements et thème clair ou sombre.</p>
      <ol className="muted mb-10 max-w-2xl list-decimal space-y-1 pl-5 text-[0.95rem]"><li>Ouvrez une page ci-dessous (vous restez connecté).</li><li>Cliquez sur le bouton bleu « Modifier l&apos;apparence » en bas à gauche.</li><li>Cliquez sur une section de la page, réglez-la dans le panneau de droite : le résultat se voit en direct.</li><li>« Enregistrer » publie le réglage sur le site.</li></ol>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {all.map(([path, label]) => {
          const n = Object.keys(styles[path] ?? {}).length;
          return (<li key={path}><Link href={`${path}?edit=1`} target="_blank" className="flex items-center justify-between rounded-2xl border p-5 transition-colors hover:bg-white/5" style={ring}><span><span className="block font-medium">{label}</span><span className="muted text-sm">{path}</span></span><span className={n ? "acc text-sm" : "muted text-sm"}>{n ? `${n} section(s) personnalisée(s)` : "Ouvrir ↗"}</span></Link></li>);
        })}
      </ul>
      <p className="muted mt-8 max-w-2xl text-sm">Limites : la scène 3D d&apos;ouverture de l&apos;accueil (portable et vue éclatée) n&apos;est pas modifiable ici. Les réglages sont rattachés à l&apos;ordre des sections de la page ; si un développeur ajoute ou retire une section, vérifiez la page.</p>
      <h2 id="contenus" className="mb-3 mt-16 text-h3 font-medium">Textes, images et zones modifiés</h2>
      <p className="muted mb-6 max-w-2xl">Tout ce que vous changez directement sur une page (éditeur visuel) se retrouve ici, et inversement : réécrire un texte, remplacer ou supprimer une image, restaurer un élément, réordonner ou supprimer une zone ajoutée. Pour ajouter une nouvelle zone ou transformer un texte en image, ouvrez la page dans l&apos;éditeur et cliquez sur l&apos;élément voulu.</p>
      <OverridesAdmin pages={all} initial={parseJson<OverridesMap>(ovRow?.value, {})} slots={parseJson<Record<string, string>>(slotRow?.value, {})} />
    </div>
  );
}

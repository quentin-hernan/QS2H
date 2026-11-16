import { db } from "@/lib/db";
import { MediaCard, MediaUpload } from "@/components/admin/Misc";

export const metadata = { title: "Médiathèque" };

export default async function Library() {
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-8">
      <header><h1 className="mb-3 text-h2 font-medium">Médiathèque</h1><p className="muted max-w-2xl">Les images sont automatiquement redimensionnées (2400 px max) et converties en WebP. Le texte alternatif est obligatoire : il rend le site accessible et aide le référencement.</p></header>
      <MediaUpload />
      {media.length === 0 ? <p className="muted rounded-2xl border p-10 text-center" style={{ borderColor: "rgb(242 239 233 / .14)" }}>Aucune image importée.</p> : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{media.map((m) => (<MediaCard key={m.id} m={m} />))}</ul>
      )}
    </div>
  );
}

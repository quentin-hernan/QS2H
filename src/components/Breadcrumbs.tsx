import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Accueil", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Fil d'Ariane" className="mb-8 text-[0.85rem] muted">
        <ol className="flex flex-wrap items-center gap-2">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page">{it.name}</span>
              ) : (
                <Link href={it.path} className="link-u">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

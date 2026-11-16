"use client";
import { useEffect, useState } from "react";

/** Sommaire latéral collant : la section lue est mise en évidence (rôle : se repérer dans un long article). */
export function TocNav({ toc }: { toc: { id: string; text: string }[] }) {
  const [active, setActive] = useState(toc[0]?.id ?? "");
  useEffect(() => {
    const on = () => {
      let cur = toc[0]?.id ?? "";
      for (const t of toc) { const el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top < innerHeight * 0.35) cur = t.id; }
      setActive(cur);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [toc]);
  return (
    <nav aria-label="Sommaire" className="lg:sticky lg:top-32">
      <p className="eyebrow mb-5">Sommaire</p>
      <ol className="space-y-1 border-l hair text-[0.95rem]">
        {toc.map((t) => (
          <li key={t.id}><a href={`#${t.id}`} aria-current={active === t.id ? "true" : undefined} className={`-ml-px block border-l-2 py-1.5 pl-4 transition-colors ${active === t.id ? "border-[rgb(var(--accent))] font-semibold text-ink-900" : "muted border-transparent hover:text-ink-900"}`}>{t.text}</a></li>
        ))}
      </ol>
    </nav>
  );
}

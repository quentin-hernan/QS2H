export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y hair border-y hair">
      {items.map((it) => (
        <details key={it.q} className="group py-1">
          <summary className="flex items-center justify-between gap-6 py-5 text-left text-[1.15rem] font-medium">
            <span>{it.q}</span>
            <span className="faq-plus acc shrink-0 text-2xl leading-none transition-transform duration-300" aria-hidden="true">+</span>
          </summary>
          <p className="muted max-w-prose pb-6 pr-10 leading-relaxed">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

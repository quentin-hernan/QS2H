"use client";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

export type BP = { id: string; slug: string; title: string; excerpt: string; category: string; cover: string; date: string; minutes: number };

/** Carte avec inclinaison 3D légère qui suit le pointeur (transform seulement). */
export function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg) translateZ(0)`;
  };
  return <div ref={ref} onPointerMove={move} onPointerLeave={() => ref.current && (ref.current.style.transform = "")} className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform">{children}</div>;
}

export function BlogList({ posts }: { posts: BP[] }) {
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const cats = useMemo(() => [...new Set(posts.map((p) => p.category))], [posts]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return posts.filter((p) => (!cat || p.category === cat) && (!n || `${p.title} ${p.excerpt}`.toLowerCase().includes(n)));
  }, [posts, cat, q]);
  const chip = (on: boolean) => `border px-4 py-2 text-[0.9rem] transition-colors hair ${on ? "bg-[color:var(--t-fg,#1C1C1C)] text-[color:var(--t-bg,#F8F8F7)] border-transparent" : "hover:bg-[color:var(--t-line,rgb(28_28_28/0.06))]"}`;
  return (
    <div>
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Catégories">
          <button type="button" className={chip(!cat)} aria-pressed={!cat} onClick={() => setCat("")}>Tous</button>
          {cats.map((c) => (<button key={c} type="button" className={chip(cat === c)} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>))}
        </div>
        <div className="w-full max-w-xs"><label className="label" htmlFor="blog-q">Rechercher un article</label><input id="blog-q" type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Prix, SEO, vitrine…" /></div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{list.length} article(s)</p>
      <motion.ul layout className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((p) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1">
                <Link href={`/blog/${p.slug}`} className="group block" data-cursor="Lire">
                  <div className="rounded-[1.5rem] relative aspect-[3/2] overflow-hidden border hair bg-ink-900">
                    {p.cover ? <Image src={p.cover} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : (
                      <div className="flex h-full items-end p-6"><span className="font-serif text-2xl text-ivory">{p.category}</span></div>
                    )}
                    <span className="absolute inset-0 origin-left scale-x-0 bg-[rgb(var(--accent)/0.55)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" aria-hidden="true" />
                  </div>
                  <p className="muted mt-5 text-[0.82rem] uppercase tracking-wider">{p.category} · {p.date} · {p.minutes} min de lecture</p>
                  <h2 className="mt-2 text-h3">{p.title}</h2>
                  <p className="muted mt-3 leading-relaxed">{p.excerpt}</p>
                </Link>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {list.length === 0 && <p className="muted py-20 text-center">Aucun article ne correspond. Essayez un autre mot ou une autre catégorie.</p>}
    </div>
  );
}

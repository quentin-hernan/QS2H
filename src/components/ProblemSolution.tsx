import { Reveal } from "./Reveal";
import { WordReveal } from "./Motion";

/** Découpe un paragraphe en phrases courtes (lecture plus facile). */
const sentences = (t: string) => (t.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? []).map((x) => x.trim()).filter(Boolean);

/** Glyphes propres à chaque service : le « problème » et la « solution » se dessinent différemment d'une page à l'autre. */
const GLYPHS: Record<string, { p: string; s: string }> = {
  "site-vitrine": { p: "M6 9h28v22H6z M6 15h28 M15 21l10 6 M25 21l-10 6", s: "M6 9h28v22H6z M6 15h28 M13 25l5 5 9-9" },
  "site-sur-mesure": { p: "M7 7h11v11H7z M22 22h11v11H22z M24 7l8 8 M32 7l-8 8", s: "M7 7h11v11H7z M22 7h11v11H22z M7 22h11v11H7z M22 22h11v11H22z" },
  "refonte-de-site": { p: "M20 6a14 14 0 1 0 .01 0z M20 12v8l6 4", s: "M31 14a12 12 0 1 0 2 8 M31 6v8h-8" },
  "e-commerce": { p: "M5 8h5l4 16h16l3-12H12 M16 31h.01 M28 31h.01 M17 17h12", s: "M5 8h5l4 16h16l3-12H12 M16 31h.01 M28 31h.01 M17 17l3 3 6-6" },
  "referencement-seo": { p: "M17 6a11 11 0 1 0 .01 0z M25 25l9 9 M13 13l8 8 M21 13l-8 8", s: "M17 6a11 11 0 1 0 .01 0z M25 25l9 9 M12 17l4 4 7-8" },
  "maintenance-hebergement": { p: "M20 5l13 5v10c0 8-6 13-13 15C13 33 7 28 7 20V10z M20 13v9 M20 27h.01", s: "M20 5l13 5v10c0 8-6 13-13 15C13 33 7 28 7 20V10z M14 20l5 5 8-9" },
};

/** Problème → solution : le problème se forme mot à mot, la solution apparaît phrase par phrase, chacune validée par une coche qui se dessine. */
export function ProblemSolution({ problem, solution, slug = "" }: { problem: string; solution: string; slug?: string }) {
  const g = GLYPHS[slug];
  const sol = sentences(solution);
  return (
    <section className="light-section py-20 md:py-28" aria-label="Le problème et notre solution">
      <div className="container grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] lg:gap-0">
        <Reveal className="ps-card ps-problem">
          <header className="ps-head">
            <span className="ps-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40"><circle className="ps-ring" cx="20" cy="20" r="19" />{g ? <path className="ps-glyph" d={g.p} pathLength="1" /> : <><path className="ps-mark" d="M20 11v11" /><circle className="ps-dotm" cx="20" cy="28.5" r="1.6" /></>}</svg>
            </span>
            <p className="eyebrow">Le problème</p>
          </header>
          <p className="ps-problem-text"><WordReveal text={problem} step={34} /></p>
        </Reveal>

        <div className="ps-link" aria-hidden="true">
          <svg viewBox="0 0 72 24"><path className="ps-line" d="M4 12h58" /><path className="ps-head-arrow" d="M56 5l8 7-8 7" /></svg>
        </div>

        <Reveal delay={0.12} className="ps-card ps-solution">
          <header className="ps-head">
            <span className="ps-icon ps-ok" aria-hidden="true">
              <svg viewBox="0 0 40 40"><circle className="ps-ring" cx="20" cy="20" r="19" />{g ? <path className="ps-glyph" d={g.s} pathLength="1" /> : <path className="ps-check" d="M12 20.5l5.5 5.5L28.5 14" pathLength="1" />}</svg>
            </span>
            <p className="eyebrow">Notre solution</p>
          </header>
          <ol className="ps-steps">
            {sol.map((t, i) => (
              <li key={i} style={{ ["--i" as string]: i }}>
                <span className="ps-tick" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" /></svg></span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

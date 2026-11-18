"use client";
import { useEffect, useRef } from "react";

type Kind = "vitrine" | "mesure" | "refonte" | "commerce" | "seo" | "maintenance";
const kindOf = (slug: string): Kind => {
  const s = slug.toLowerCase();
  if (/refonte/.test(s)) return "refonte";
  if (/commerce|boutique/.test(s)) return "commerce";
  if (/seo|referencement/.test(s)) return "seo";
  if (/maint|heberg/.test(s)) return "maintenance";
  if (/mesure|application/.test(s)) return "mesure";
  return "vitrine";
};

/** Illustration animée propre à chaque service (tracés au défilement + mouvements lents). Décorative, masquée aux lecteurs d'écran. */
export function ServiceArt({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add("in"), 250);
    return () => clearTimeout(t);
  }, []);
  const k = kindOf(slug);
  const d = (i: number) => ({ style: { ["--i" as string]: i } });
  return (
    <div ref={ref} className="ia sa" aria-hidden="true" data-k={k}>
      <svg viewBox="0 0 600 420" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {k === "vitrine" && (
          <g className="ia-float">
            <rect className="ia-fill" x="60" y="40" width="480" height="320" rx="22" />
            <rect className="ia-d" pathLength="1" {...d(0)} x="60" y="40" width="480" height="320" rx="22" />
            <path className="ia-d" pathLength="1" {...d(1)} d="M60 92h480" />
            <circle className="ia-d" pathLength="1" {...d(2)} cx="90" cy="66" r="7" /><circle className="ia-d" pathLength="1" {...d(2)} cx="116" cy="66" r="7" /><circle className="ia-d" pathLength="1" {...d(2)} cx="142" cy="66" r="7" />
            <path className="ia-d" pathLength="1" {...d(3)} d="M96 140h190M96 172h140M96 212h170" />
            <rect className="ia-d ia-hi sa-pulse" pathLength="1" {...d(4)} x="96" y="246" width="112" height="38" rx="19" />
            <rect className="ia-d" pathLength="1" {...d(4)} x="330" y="126" width="170" height="130" rx="16" />
            <path className="ia-d" pathLength="1" {...d(5)} d="M330 256l58-62 50 44 28-24 34 42" />
            <path className="ia-d" pathLength="1" {...d(6)} d="M96 316h108M228 316h92M344 316h156" />
            <path className="sa-cursor" d="M430 300l-6 40 12-10 8 16 8-4-8-16 16-2z" />
          </g>
        )}
        {k === "mesure" && (
          <g>
            <g className="sa-block sa-b1"><rect className="ia-fill" x="90" y="90" width="190" height="110" rx="14" /><rect className="ia-d ia-hi" pathLength="1" {...d(0)} x="90" y="90" width="190" height="110" rx="14" /></g>
            <g className="sa-block sa-b2"><rect className="ia-fill" x="300" y="90" width="210" height="110" rx="14" /><rect className="ia-d" pathLength="1" {...d(1)} x="300" y="90" width="210" height="110" rx="14" /></g>
            <g className="sa-block sa-b3"><rect className="ia-fill" x="90" y="220" width="130" height="110" rx="14" /><rect className="ia-d" pathLength="1" {...d(2)} x="90" y="220" width="130" height="110" rx="14" /></g>
            <g className="sa-block sa-b4"><rect className="ia-fill" x="240" y="220" width="270" height="110" rx="14" /><rect className="ia-d" pathLength="1" {...d(3)} x="240" y="220" width="270" height="110" rx="14" /></g>
            <path className="ia-d" pathLength="1" {...d(4)} d="M126 130l-24 20 24 20M244 130l24 20-24 20M190 126l-20 48" />
            <path className="ia-d" pathLength="1" {...d(5)} d="M330 130h140M330 160h96M270 270h200M270 300h120" />
          </g>
        )}
        {k === "refonte" && (
          <g>
            <g className="ia-float">
              <rect className="ia-fill" x="40" y="70" width="240" height="280" rx="18" />
              <rect className="ia-d sa-dash" pathLength="1" {...d(0)} x="40" y="70" width="240" height="280" rx="18" />
              <path className="ia-d sa-dash" pathLength="1" {...d(1)} d="M70 120h120M70 150h160M70 180h90M70 250h170M70 280h110" />
            </g>
            <path className="ia-d ia-hi" pathLength="1" {...d(3)} d="M296 210h54M334 192l20 18-20 18" />
            <g className="ia-float ia-float2">
              <rect className="ia-fill" x="320" y="50" width="250" height="300" rx="20" />
              <rect className="ia-d ia-hi" pathLength="1" {...d(4)} x="320" y="50" width="250" height="300" rx="20" />
              <path className="ia-d" pathLength="1" {...d(5)} d="M320 100h250" />
              <rect className="ia-d" pathLength="1" {...d(6)} x="350" y="130" width="190" height="90" rx="12" />
              <path className="ia-d" pathLength="1" {...d(7)} d="M350 256h120M350 286h170M350 316h90" />
              <rect className="sa-wipe" x="320" y="50" width="250" height="300" rx="20" />
            </g>
          </g>
        )}
        {k === "commerce" && (
          <g>
            <g className="ia-float">
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect className="ia-fill" x={50 + i * 150} y="60" width="130" height="170" rx="16" />
                  <rect className="ia-d" pathLength="1" {...d(i)} x={50 + i * 150} y="60" width="130" height="170" rx="16" />
                  <rect className="ia-d" pathLength="1" {...d(i + 1)} x={64 + i * 150} y="74" width="102" height="76" rx="10" />
                  <path className="ia-d" pathLength="1" {...d(i + 2)} d={`M${64 + i * 150} 172h74M${64 + i * 150} 196h46`} />
                </g>
              ))}
            </g>
            <g className="ia-float ia-float2">
              <path className="ia-d ia-hi" pathLength="1" {...d(5)} d="M110 300h50l22 62h172l22-90H178" />
              <circle className="ia-d ia-hi" pathLength="1" {...d(6)} cx="206" cy="390" r="13" /><circle className="ia-d ia-hi" pathLength="1" {...d(6)} cx="360" cy="390" r="13" />
              <circle className="sa-badge" cx="420" cy="280" r="20" />
              <path className="sa-check" d="M410 281l8 8 14-16" />
            </g>
          </g>
        )}
        {k === "seo" && (
          <g>
            <path className="ia-d" pathLength="1" {...d(0)} d="M60 40v320h480" />
            <path className="ia-d" pathLength="1" {...d(1)} d="M60 300h480M60 240h480M60 180h480M60 120h480" style={{ opacity: 0.25, ["--i" as string]: 1 }} />
            {[0, 1, 2, 3, 4, 5].map((i) => (<rect key={i} className="sa-bar" x={90 + i * 75} y={320 - (50 + i * 38)} width="42" height={50 + i * 38} rx="8" style={{ animationDelay: `${0.5 + i * 0.14}s` }} />))}
            <path className="ia-d ia-hi" pathLength="1" {...d(3)} d="M100 290C170 270 220 230 285 214s140-60 235-130" />
            <g className="sa-glass"><circle className="ia-d ia-hi" pathLength="1" {...d(5)} cx="470" cy="110" r="42" /><path className="ia-d ia-hi" pathLength="1" {...d(6)} d="M500 142l34 34" /></g>
            <g><rect className="ia-fill" x="440" y="46" width="64" height="30" rx="15" /><path className="ia-d" pathLength="1" {...d(7)} d="M452 62h38" /></g>
          </g>
        )}
        {k === "maintenance" && (
          <g>
            <g className="ia-float">
              <path className="ia-fill" d="M300 40l150 52v110c0 90-62 150-150 178-88-28-150-88-150-178V92z" />
              <path className="ia-d ia-hi" pathLength="1" {...d(0)} d="M300 40l150 52v110c0 90-62 150-150 178-88-28-150-88-150-178V92z" />
              <path className="sa-check big" pathLength="1" d="M232 214l46 46 92-100" />
            </g>
            <g className="sa-gear"><path className="ia-d" pathLength="1" {...d(3)} d="M92 330a20 20 0 1 1 0-1zM92 300v-14M92 372v-14M62 330H48M136 330h-14M71 309l-10-10M123 361l-10-10M71 351l-10 10M123 299l-10 10" /></g>
            <path className="ia-d sa-beat" pathLength="1" {...d(5)} d="M40 396h120l16-34 24 62 22-48 14 20h330" />
          </g>
        )}
      </svg>
    </div>
  );
}

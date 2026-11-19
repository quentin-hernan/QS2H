/**
 * Images de couverture provisoires des articles du blog (Budget, Conseils, SEO), aux couleurs du site.
 * Elles passent par la médiathèque (Supabase en production) et restent remplaçables dans l'admin › Articles.
 * N'écrase jamais une couverture déjà choisie.  Lancer : npx tsx --conditions=react-server --env-file=.env scripts/make-blog-covers.ts
 */
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { saveImage } from "../src/lib/media";

const INK = "#1C1C1C", IVORY = "#F8F8F7", PAPER = "#EFEFED", ACC = "#2A5587", ACC2 = "#7FA9D9", MUTE = "#C9CBCE";
const W = 1600, H = 900;
const frame = (inner: string, bg = PAPER) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <g opacity=".5" stroke="${MUTE}" stroke-width="1">${Array.from({ length: 15 }, (_, i) => `<path d="M${i * 120 + 40} 0V${H}"/>`).join("")}</g>
  ${inner}</svg>`;

/** Fenêtre de navigateur sobre (barre + 3 pastilles). */
const win = (x: number, y: number, w: number, h: number, body: string, dark = false) => `
  <g transform="translate(${x} ${y})">
    <rect x="10" y="18" width="${w}" height="${h}" rx="18" fill="#000" opacity=".08"/>
    <rect width="${w}" height="${h}" rx="18" fill="${dark ? INK : "#fff"}"/>
    <path d="M0 18a18 18 0 0 1 18-18h${w - 36}a18 18 0 0 1 18 18v32H0z" fill="${dark ? "#2A2A2A" : "#E7E7E4"}"/>
    ${[0, 1, 2].map((i) => `<circle cx="${28 + i * 22}" cy="25" r="6" fill="${dark ? "#555" : MUTE}"/>`).join("")}
    <g transform="translate(0 50)">${body}</g>
  </g>`;
const bar = (x: number, y: number, w: number, h = 14, c = INK, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(7, h / 2)}" fill="${c}" opacity="${o}"/>`;

const budget = frame(`
  ${win(170, 170, 620, 560, `
    ${bar(48, 54, 210, 18, ACC)}
    ${[0, 1, 2, 3].map((i) => `${bar(48, 120 + i * 62, 300, 12, INK, 0.75)}${bar(452, 120 + i * 62, 120, 12, INK, 0.5)}<path d="M48 ${150 + i * 62}H572" stroke="${MUTE}"/>`).join("")}
    <path d="M48 382H572" stroke="${INK}" stroke-width="2"/>
    ${bar(48, 410, 140, 16, INK)}${bar(412, 404, 160, 28, ACC)}
  `)}
  <g transform="translate(900 200)">
    <path d="M0 520H560" stroke="${INK}" stroke-width="2"/>
    ${[[60, 180], [210, 300], [360, 430]].map(([x, h], i) => `<rect x="${x}" y="${520 - h}" width="96" height="${h}" rx="10" fill="${i === 2 ? ACC : INK}" opacity="${i === 2 ? 1 : 0.18 + i * 0.25}"/>`).join("")}
    <g transform="translate(470 40)"><circle r="62" fill="${IVORY}" stroke="${ACC}" stroke-width="6"/><path d="M14 -26a32 32 0 1 0 0 52M-34 -8h40M-34 10h40" stroke="${ACC}" stroke-width="8" fill="none" stroke-linecap="round"/></g>
  </g>`);

const conseils = frame(`
  ${win(150, 190, 560, 500, `
    ${bar(44, 52, 180, 18, ACC)}${bar(44, 100, 470, 28, INK, 0.85)}${bar(44, 146, 360, 12, INK, 0.45)}
    <rect x="44" y="196" width="470" height="200" rx="12" fill="${PAPER}"/>
    ${bar(44, 418, 120, 14, ACC)}
  `)}
  ${win(890, 150, 560, 580, `
    ${bar(44, 52, 160, 18, ACC2)}
    ${[[44, 100, 225, 150], [289, 100, 225, 150], [44, 270, 470, 120], [44, 410, 140, 90], [204, 410, 140, 90], [364, 410, 150, 90]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${i === 2 ? ACC : "#3A3A3A"}" opacity="${i === 2 ? 0.95 : 1}"/>`).join("")}
  `, true)}
  <path d="M735 440h120" stroke="${INK}" stroke-width="3" stroke-dasharray="4 12" stroke-linecap="round"/>
  <path d="M842 426l16 14-16 14" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);

const seo = frame(`
  ${win(160, 150, 820, 600, `
    <rect x="48" y="44" width="724" height="64" rx="32" fill="${PAPER}"/><circle cx="92" cy="76" r="14" fill="none" stroke="${INK}" stroke-width="4"/><path d="M102 86l14 14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>${bar(136, 68, 260, 16, INK, 0.7)}
    <rect x="40" y="140" width="740" height="120" rx="16" fill="${ACC}" opacity=".1"/><rect x="40" y="140" width="6" height="120" rx="3" fill="${ACC}"/>
    ${bar(72, 166, 120, 12, ACC)}${bar(72, 194, 420, 20, INK)}${bar(72, 228, 520, 10, INK, 0.45)}
    ${[0, 1].map((i) => `${bar(72, 300 + i * 112, 110, 10, INK, 0.35)}${bar(72, 324 + i * 112, 380, 18, INK, 0.65)}${bar(72, 356 + i * 112, 480, 10, INK, 0.3)}`).join("")}
  `)}
  <g transform="translate(1060 220)">
    <rect width="380" height="460" rx="22" fill="#fff"/><rect x="10" y="18" width="380" height="460" rx="22" fill="#000" opacity=".06"/>
    <path d="M0 330C80 300 120 360 210 320S330 270 380 300V460H0z" fill="${ACC2}" opacity=".35"/>
    <path d="M40 80L180 140L340 90M60 200L220 180L360 230M120 30L150 440M260 20L240 440" stroke="${MUTE}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g transform="translate(205 205)"><circle r="46" fill="${ACC}" opacity=".15"/><path d="M0 26c-20-26-30-38-30-54a30 30 0 0 1 60 0c0 16-10 28-30 54z" fill="${ACC}"/><circle cy="-28" r="11" fill="#fff"/></g>
  </g>`);

const COVERS: Record<string, { svg: string; alt: string }> = {
  Budget: { svg: budget, alt: "Illustration : un devis détaillé et des colonnes de budget, aux couleurs de QS2H" },
  Conseils: { svg: conseils, alt: "Illustration : un site vitrine simple face à un site sur mesure plus riche" },
  SEO: { svg: seo, alt: "Illustration : un premier résultat de recherche mis en avant et une carte avec une épingle" },
};

(async () => {
  const db = new PrismaClient();
  const posts = await db.post.findMany({ where: { cover: "" } });
  for (const p of posts) {
    const c = COVERS[p.category] ?? COVERS.Conseils;
    const png = await sharp(Buffer.from(c.svg)).png().toBuffer();
    if (process.argv.includes("--preview")) { await sharp(png).resize(800).toFile(`${process.env.PREVIEW_DIR || "."}/cover-${p.category}.png`); continue; }
    const m = await saveImage(png, `blog-${p.slug}`, c.alt, 1600);
    await db.post.update({ where: { id: p.id }, data: { cover: m.url } });
    console.log("✓", p.slug, m.url);
  }
  await db.$disconnect();
})();

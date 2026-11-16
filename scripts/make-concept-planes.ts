/**
 * Génère les plans des 3 projets concept : de vraies pages HTML concept sont ouvertes dans Chromium puis découpées
 * par le MÊME pipeline de capture que celui du back-office (src/lib/capture-core.ts).
 * Sortie : public/seed/<slug>/NN.webp et prisma/concept-planes.json.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import { captureSite } from "../src/lib/capture-core";

type C = { slug: string; brand: string; font: string; bg: string; ink: string; accent: string; soft: string; nav: string[]; h1: string; sub: string; cta: string; services: [string, string][]; band: string; bandText: string; footer: string };
const concepts: C[] = [
  { slug: "atelier-bois", brand: "Atelier Bois", font: "'Segoe UI', Arial, Helvetica, sans-serif", bg: "#F3EEE6", ink: "#2b2118", accent: "#8a5a2b", soft: "#E2D6C2", nav: ["Réalisations", "Savoir-faire", "Devis"], h1: "Agencements en bois, dessinés et fabriqués sur mesure", sub: "Escaliers, bibliothèques, cuisines : un atelier, un interlocuteur.", cta: "Demander un devis", services: [["Escaliers", "Dessinés sur plan, posés par nos soins."], ["Agencements", "Bibliothèques, dressings, banques d'accueil."], ["Cuisines", "Façades et plans de travail en bois massif."]], band: "Du croquis à la pose", bandText: "Visite, plan coté, fabrication en atelier, installation. Chaque étape est validée avec vous avant la suivante.", footer: "Atelier Bois — projet concept QS2H" },
  { slug: "table-du-quai", brand: "La Table du Quai", font: "Arial, Helvetica, sans-serif", bg: "#14181c", ink: "#f2efe9", accent: "#c8553d", soft: "#222a31", nav: ["La carte", "Le lieu", "Réserver"], h1: "Une brasserie de bord d'eau, une carte qui change avec les saisons", sub: "Cuisine de produits locaux, service midi et soir.", cta: "Réserver une table", services: [["Le midi", "Plat du jour et formule, servis en quarante minutes."], ["Le soir", "Carte courte, produits de saison."], ["Privatisation", "Repas d'équipe et événements, jusqu'à quarante couverts."]], band: "La carte, mise à jour en deux minutes", bandText: "Le back-office permet à l'équipe de modifier la carte et les horaires depuis un téléphone, sans passer par un prestataire.", footer: "La Table du Quai — projet concept QS2H" },
  { slug: "cabinet-conseil", brand: "Cabinet Conseil", font: "'Segoe UI', Arial, Helvetica, sans-serif", bg: "#EEF0F2", ink: "#16202b", accent: "#1f3a5f", soft: "#D9DEE5", nav: ["Expertises", "Équipe", "Honoraires"], h1: "Conseil juridique pour dirigeants de PME", sub: "Droit des sociétés, contrats commerciaux, relations sociales.", cta: "Prendre rendez-vous", services: [["Droit des sociétés", "Statuts, pactes d'associés, transmissions."], ["Contrats", "Conditions générales, partenariats, distribution."], ["Social", "Embauches, ruptures, accords d'entreprise."]], band: "Des honoraires annoncés avant de commencer", bandText: "Chaque dossier démarre par un devis écrit. Pas de surprise, pas de facturation au quart d'heure.", footer: "Cabinet Conseil — projet concept QS2H" },
];

const html = (c: C) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${c.brand} — ${c.h1.slice(0, 40)}</title><meta name="description" content="${c.sub}"><meta name="generator" content="Next.js"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box;margin:0}body{background:${c.bg};color:${c.ink};font:18px/1.55 Arial,sans-serif}
header{display:flex;justify-content:space-between;align-items:center;padding:26px 6vw;border-bottom:1px solid ${c.ink}22}header b{font:700 26px ${c.font}}nav{display:flex;gap:34px;font-size:16px;opacity:.75}header a.b{background:${c.accent};color:#fff;padding:12px 24px;font-size:15px}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:6vw;padding:90px 6vw;min-height:640px;align-items:center}.hero h1{font:700 62px/1.04 ${c.font};letter-spacing:-.02em}.hero p{margin:26px 0 38px;font-size:22px;opacity:.75;max-width:30ch}.btn{display:inline-block;background:${c.accent};color:#fff;padding:18px 34px;font-size:17px}
.art{height:480px;background:${c.soft};position:relative}.art i{position:absolute;background:${c.accent}}.art i:nth-child(1){left:12%;top:14%;width:50%;height:46%}.art i:nth-child(2){left:44%;top:50%;width:42%;height:36%;background:${c.ink};opacity:.85}.art i:nth-child(3){left:10%;top:66%;width:28%;height:20%;background:${c.bg}}
.sv{padding:90px 6vw}.sv h2,.bd h2{font:700 40px ${c.font};margin-bottom:46px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.card{background:${c.soft};padding:34px;min-height:230px}.card h3{font:700 24px ${c.font};margin-bottom:12px}.card p{opacity:.75}
.bd{background:${c.ink};color:${c.bg};padding:100px 6vw}.bd p{font-size:24px;max-width:36ch;opacity:.85}
.ct{padding:100px 6vw;text-align:center}.ct h2{font:700 44px ${c.font};margin-bottom:30px}
footer{display:flex;justify-content:space-between;padding:44px 6vw;border-top:1px solid ${c.ink}22;font-size:15px;opacity:.8}
@media(max-width:700px){.hero{grid-template-columns:1fr;padding:50px 6vw;min-height:0}.hero h1{font-size:36px}.art{height:240px}.cards{grid-template-columns:1fr}nav{display:none}header a.b{display:none}.bd p{font-size:19px}footer{flex-direction:column;gap:10px}}</style></head>
<body><header><b>${c.brand}</b><nav>${c.nav.map((n) => `<span>${n}</span>`).join("")}</nav><a class="b">Contact</a></header>
<main><section class="hero"><div><h1>${c.h1}</h1><p>${c.sub}</p><a class="btn">${c.cta}</a></div><div class="art"><i></i><i></i><i></i></div></section>
<section class="sv"><h2>Ce que nous faisons</h2><div class="cards">${c.services.map(([t, d]) => `<div class="card"><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></section>
<section class="bd"><h2>${c.band}</h2><p>${c.bandText}</p></section>
<section class="ct"><h2>Parlons de votre projet</h2><a class="btn">${c.cta}</a></section></main>
<footer><span>${c.footer}</span><span>Mentions légales · Contact</span></footer></body></html>`;

async function main() {
  const out: Record<string, unknown> = {};
  const tmp = path.join(process.cwd(), "shots", "concepts");
  await fs.mkdir(tmp, { recursive: true });
  for (const c of concepts) {
    const file = path.join(tmp, `${c.slug}.html`);
    await fs.writeFile(file, html(c));
    const cap = await captureSite(pathToFileURL(file).toString(), { trusted: true, psi: false });
    const dir = path.join(process.cwd(), "public", "seed", c.slug);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const planes = [];
    for (const [i, p] of cap.planes.entries()) {
      const name = `${String(i + 1).padStart(2, "0")}.webp`;
      await sharp(p.png).resize({ width: p.kind === "mobile" ? 780 : 1600, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(dir, name));
      planes.push({ id: `${c.slug}-${i + 1}`, name: p.name, kind: p.kind, image: `/seed/${c.slug}/${name}`, caption: "", depth: i });
    }
    const hero = cap.planes.find((p) => p.kind === "hero") ?? cap.planes[0];
    await sharp(hero.png).resize({ width: 1600, height: 1000, fit: "cover", position: "top" }).webp({ quality: 84 }).toFile(path.join(process.cwd(), "public", "seed", `${c.slug}.webp`));
    out[c.slug] = { planes, meta: { ...cap.meta, url: "", lighthouse: null } };
    console.log("ok", c.slug, planes.length, "plans");
  }
  await fs.writeFile(path.join(process.cwd(), "prisma", "concept-planes.json"), JSON.stringify(out, null, 1));
}
main();

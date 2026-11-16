import * as THREE from "three";
import { roundRectPath } from "./geometry";

const SURF = "#14171C", IVORY = "#F2EFE9", MUTE = "#9A9A94", LINE = "rgba(242,239,233,.16)";

function canvas(w = 1184, h = 740) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function finish(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function frame(g: CanvasRenderingContext2D, w: number, h: number, accent: string, n: string, name: string, tag: string) {
  g.fillStyle = SURF;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = LINE;
  g.lineWidth = 2;
  g.strokeRect(1, 1, w - 2, h - 2);
  g.fillStyle = accent;
  g.fillRect(0, 0, 10, h);
  g.fillStyle = MUTE;
  g.font = "500 26px Helvetica, Arial, sans-serif";
  g.fillText(n, 56, 74);
  g.fillStyle = IVORY;
  g.font = "italic 64px Georgia, serif";
  g.fillText(name, 56, 150);
  g.fillStyle = MUTE;
  g.font = "24px Helvetica, Arial, sans-serif";
  g.textAlign = "right";
  g.fillText(tag, w - 56, 74);
  g.textAlign = "left";
}

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, accent: string) => void;

const draws: Record<string, Draw> = {
  Design: (g, w, h, a) => {
    g.strokeStyle = "rgba(242,239,233,.35)";
    g.setLineDash([10, 8]);
    g.lineWidth = 2;
    roundRectPath(g, 56, 200, w - 112, 170, 12); g.stroke();
    [0, 1, 2].forEach((i) => { roundRectPath(g, 56 + i * 370, 400, 340, 250, 12); g.stroke(); });
    g.setLineDash([]);
    g.strokeStyle = "rgba(242,239,233,.12)";
    g.beginPath(); g.moveTo(56, 200); g.lineTo(w - 56, 370); g.moveTo(w - 56, 200); g.lineTo(56, 370); g.stroke();
    [a, IVORY, "#2a2f38", MUTE].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(w - 300 + i * 70, 112, 26, 0, 7); g.fill(); });
  },
  Contenu: (g, w, h, a) => {
    g.fillStyle = IVORY; g.fillRect(56, 210, 520, 30);
    g.fillStyle = a; g.fillRect(56, 258, 340, 30);
    g.fillStyle = "rgba(242,239,233,.28)";
    for (let i = 0; i < 6; i++) g.fillRect(56, 340 + i * 36, 640 - (i % 3) * 90, 14);
    g.fillStyle = "rgba(242,239,233,.1)"; roundRectPath(g, 760, 200, 368, 440, 14); g.fill();
    g.fillStyle = IVORY; g.font = "600 30px Helvetica, Arial"; g.fillText("H1", 790, 252);
    g.fillStyle = a; g.fillRect(790, 280, 120, 8);
    g.fillStyle = IVORY; g.fillText("H2", 790, 360); g.fillRect(790, 388, 200, 6);
    g.fillText("H2", 790, 470); g.fillRect(790, 498, 160, 6);
  },
  Code: (g, w, h, a) => {
    const cols = [a, IVORY, MUTE, "#6f7380"];
    let y = 210;
    const indents = [0, 1, 1, 2, 2, 2, 1, 1, 2, 2, 3, 2, 1, 0];
    indents.forEach((ind, i) => {
      let x = 90 + ind * 40;
      for (let k = 0; k < 3; k++) {
        const wd = 50 + ((i * 37 + k * 59) % 150);
        g.globalAlpha = k ? 0.5 : 1; g.fillStyle = cols[(i + k) % 4]; g.fillRect(x, y, wd, 14); x += wd + 16;
      }
      g.globalAlpha = 1; g.fillStyle = "rgba(242,239,233,.25)"; g.font = "16px monospace"; g.fillText(String(i + 1), 56, y + 13);
      y += 38;
    });
  },
  Référencement: (g, w, h, a) => {
    g.fillStyle = IVORY; g.font = "26px Helvetica, Arial";
    g.fillStyle = MUTE; g.fillText("www.votre-site.fr › services", 56, 226);
    g.fillStyle = a; g.font = "600 34px Helvetica, Arial"; g.fillText("Création de site web à Bordeaux", 56, 274);
    g.fillStyle = "rgba(242,239,233,.3)"; g.fillRect(56, 304, 760, 12); g.fillRect(56, 330, 620, 12);
    g.fillStyle = IVORY; g.font = "600 24px Helvetica, Arial"; g.fillText("Positions", 56, 430);
    [60, 95, 90, 150, 190, 175, 240].forEach((v, i) => { g.fillStyle = i === 6 ? a : "rgba(242,239,233,.55)"; g.fillRect(56 + i * 70, 640 - v, 46, v); });
    g.strokeStyle = LINE; roundRectPath(g, 700, 400, 428, 240, 14); g.stroke();
    g.fillStyle = IVORY; g.font = "22px Helvetica, Arial"; g.fillText("Données structurées", 730, 450);
    [0, 1, 2].forEach((i) => { g.fillStyle = a; g.beginPath(); g.arc(742, 500 + i * 44, 7, 0, 7); g.fill(); g.fillStyle = "rgba(242,239,233,.3)"; g.fillRect(764, 494 + i * 44, 220 - i * 30, 10); });
  },
  Performance: (g, w, h, a) => {
    const cx = 270, cy = 440, r = 150;
    g.lineWidth = 22; g.strokeStyle = "rgba(242,239,233,.12)"; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = a; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.62); g.stroke();
    g.fillStyle = IVORY; g.font = "600 84px Helvetica, Arial"; g.textAlign = "center"; g.fillText("A", cx, cy + 28); g.textAlign = "left";
    ["Chargement", "Stabilité visuelle", "Réactivité", "Accessibilité"].forEach((t, i) => {
      g.fillStyle = MUTE; g.font = "24px Helvetica, Arial"; g.fillText(t, 560, 270 + i * 100);
      g.fillStyle = "rgba(242,239,233,.12)"; g.fillRect(560, 288 + i * 100, 560, 14);
      g.fillStyle = i === 0 ? a : IVORY; g.fillRect(560, 288 + i * 100, 470 - i * 24, 14);
    });
  },
};

export function makeLayerTexture(name: string, index: number, total: number, accent: string, tag: string) {
  const c = canvas();
  const g = c.getContext("2d")!;
  frame(g, c.width, c.height, accent, `0${index + 1} / 0${total}`, name, tag);
  const order = ["Design", "Contenu", "Code", "Référencement", "Performance"];
  (draws[order[index] ?? "Design"] ?? draws.Design)(g, c.width, c.height, accent);
  return finish(c);
}

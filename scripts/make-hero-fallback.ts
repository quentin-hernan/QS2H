import sharp from "sharp";
import path from "node:path";

async function main() {
  const cover = await sharp(path.join("public", "seed", "menuiserie-duval.webp")).resize(940, 588).png().toBuffer();
  const b64 = cover.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="al" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dce1"/><stop offset="1" stop-color="#8f939b"/></linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd2d8"/><stop offset="1" stop-color="#9fa3ab"/></linearGradient>
    <radialGradient id="sh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="800" cy="835" rx="640" ry="70" fill="url(#sh)"/>
  <rect x="290" y="150" width="1020" height="580" rx="26" fill="url(#lid)"/>
  <rect x="318" y="174" width="964" height="532" rx="12" fill="#030304"/>
  <image x="330" y="180" width="940" height="520" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${b64}"/>
  <path d="M230 742 H1370 L1420 800 Q1424 812 1410 812 H190 Q176 812 180 800 Z" fill="url(#al)"/>
  <rect x="680" y="742" width="240" height="12" rx="6" fill="#7f838b" opacity=".7"/>
</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 88, alphaQuality: 90 }).toFile(path.join("public", "hero-fallback.webp"));
  console.log("ok");
}
main();

// Génère les icônes d'onglet carrées (favicon.ico, icon-512, apple-touch-icon) à partir du logo : monogramme « QS » sur fond blanc arrondi.
const sharp = require("sharp");
const fs = require("fs");
const pad = (n) => n;
(async () => {
  const L = { left: 56, top: 40, width: 332, height: 138 }; // « QS » dans public/logo.png (720 x 227)
  const letters = await sharp("public/logo.png").extract(L).toBuffer();
  const make = async (size, bg = "#FFFFFF") => {
    const inner = Math.round(size * 0.84);
    const lt = await sharp(letters).resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    const r = Math.round(size * 0.2);
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/></svg>`);
    return sharp(mask).composite([{ input: lt, gravity: "centre" }]).png().toBuffer();
  };
  fs.writeFileSync("public/icon-512.png", await make(512));
  fs.writeFileSync("public/icon-192.png", await make(192));
  fs.writeFileSync("public/apple-touch-icon.png", await sharp(await make(512, "#FFFFFF")).resize(180).png().toBuffer());
  // favicon.ico : 16, 32 et 48 px (PNG intégrés)
  const sizes = [16, 32, 48];
  const imgs = await Promise.all(sizes.map(async (s) => sharp(await make(256)).resize(s).png().toBuffer()));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = 6 + 16 * imgs.length;
  const dir = imgs.map((b, i) => { const e = Buffer.alloc(16); e[0] = sizes[i]; e[1] = sizes[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(b.length, 8); e.writeUInt32LE(off, 12); off += b.length; return e; });
  fs.writeFileSync("public/favicon.ico", Buffer.concat([head, ...dir, ...imgs]));
  await sharp(await make(256)).resize(32).png().toFile(process.argv[2] || "public/_prev32.png");
  console.log("ok");
})();

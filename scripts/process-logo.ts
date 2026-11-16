import sharp from "sharp";
import path from "node:path";

const src = path.join(process.cwd(), "public", "logo-original.png");
const out = path.join(process.cwd(), "public");

async function main() {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const dark = Buffer.alloc(data.length);
  const light = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // fond blanc -> transparence ; couleurs recalculées (dépremultiplication sur blanc)
    const a = 255 - Math.min(r, g, b);
    const al = a / 255;
    const un = (c: number) => (al > 0.01 ? Math.max(0, Math.min(255, Math.round((c - 255 * (1 - al)) / al))) : 0);
    const R = un(r), G = un(g), B = un(b);
    // "redness" : 0 (noir) -> 1 (accent d'origine). Les pixels d'accent sont recolorés en bleu QS2H ; les lettres noires restent noires / deviennent ivoire.
    const t = Math.max(0, Math.min(1, (R - Math.max(G, B)) / 110));
    const mix = (a0: number, b0: number) => Math.round(a0 + (b0 - a0) * t);
    // version sombre (logo.png) : noir + bleu #2A5587 ; version claire : ivoire + bleu clair #7FA9D9
    dark[i] = mix(28, 42); dark[i + 1] = mix(28, 85); dark[i + 2] = mix(28, 135); dark[i + 3] = a;
    light[i] = mix(248, 127); light[i + 1] = mix(248, 169); light[i + 2] = mix(248, 217);
    light[i + 3] = a;
  }
  const mk = (buf: Buffer) => sharp(buf, { raw: { width, height, channels: 4 } });
  await mk(dark).trim({ threshold: 5 }).resize({ width: 720 }).png({ compressionLevel: 9 }).toFile(path.join(out, "logo.png"));
  await mk(light).trim({ threshold: 5 }).resize({ width: 720 }).png({ compressionLevel: 9 }).toFile(path.join(out, "logo-light.png"));
  const m = await sharp(path.join(out, "logo.png")).metadata();
  console.log("logo.png", m.width, m.height);
  // icône carrée (monogramme Q) pour favicon / app icon
  await sharp(path.join(out, "logo.png")).resize(512, 512, { fit: "contain", background: { r: 248, g: 248, b: 247, alpha: 1 } }).png().toFile(path.join(out, "icon-512.png"));
  await sharp(path.join(out, "logo.png")).resize(180, 180, { fit: "contain", background: { r: 248, g: 248, b: 247, alpha: 1 } }).png().toFile(path.join(out, "apple-touch-icon.png"));
}
main();

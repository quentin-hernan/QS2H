import crypto from "node:crypto";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const decode = (s: string) => {
  let bits = "";
  for (const c of s.toUpperCase()) { const v = ALPHA.indexOf(c); if (v >= 0) bits += v.toString(2).padStart(5, "0"); }
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
};
/** Code TOTP courant (RFC 6238) pour les tests de connexion du propriétaire. */
export function totpNow(secret: string) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac("sha1", decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, "0");
}

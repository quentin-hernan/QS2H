import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

/** argon2id (paramètres OWASP : 19 Mio, t=2, p=1). Les anciens hash bcrypt restent vérifiables puis sont migrés à la connexion. */
export const hashPassword = (p: string) => argonHash(p, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 });
export async function verifyPassword(p: string, h: string) {
  try {
    return h.startsWith("$argon2") ? await argonVerify(h, p) : await bcrypt.compare(p, h);
  } catch {
    return false;
  }
}
export const needsRehash = (h: string) => !h.startsWith("$argon2id");

/** Politique : longueur, pas de règles de complexité arbitraires. */
export function passwordIssues(p: string): string | null {
  if (p.length < 12) return "12 caractères minimum.";
  if (p.length > 200) return "200 caractères maximum.";
  if (/^(.)\1+$/.test(p)) return "Choisissez un mot de passe moins répétitif.";
  return null;
}

/** Vérifie si le mot de passe figure dans une fuite connue (Have I Been Pwned, k-anonymité : seuls 5 caractères du hash sont envoyés). Ne bloque pas si le service est indisponible. */
export async function isPwned(password: string): Promise<boolean> {
  try {
    const sha = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const r = await fetch(`https://api.pwnedpasswords.com/range/${sha.slice(0, 5)}`, { headers: { "Add-Padding": "true" }, signal: AbortSignal.timeout(3500) });
    if (!r.ok) return false;
    const rest = sha.slice(5);
    return (await r.text()).split("\n").some((l) => { const [suffix, n] = l.trim().split(":"); return suffix === rest && Number(n) > 0; });
  } catch {
    return false;
  }
}

export async function checkNewPassword(p: string): Promise<string | null> {
  const i = passwordIssues(p);
  if (i) return i;
  if (await isPwned(p)) return "Ce mot de passe figure dans une fuite de données connue. Choisissez-en un autre.";
  return null;
}

export const token = () => crypto.randomBytes(32).toString("hex");
export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

import dns from "node:dns/promises";
import net from "node:net";

/** Vrai si l'adresse IP est privée, locale, réservée ou de métadonnées cloud (protection SSRF). */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
    const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    if (m) return isPrivateIp(m[1]);
    return false;
  }
  return true;
}

/** Valide une URL publique : http(s) uniquement, ports standards, pas d'identifiants, aucune adresse interne. Retourne l'URL normalisée. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw new Error("URL invalide."); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Seules les adresses http(s) sont acceptées.");
  if (u.username || u.password) throw new Error("Les identifiants dans l'URL sont interdits.");
  if (u.port && !["80", "443"].includes(u.port)) throw new Error("Seuls les ports 80 et 443 sont acceptés.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Adresse interne refusée.");
  const addrs = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true }).catch(() => { throw new Error("Nom de domaine introuvable."); })).map((a) => a.address);
  if (!addrs.length || addrs.some(isPrivateIp)) throw new Error("Adresse interne ou privée refusée.");
  return u;
}

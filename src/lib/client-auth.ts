import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "qs2h_client";
const MAX_AGE = 60 * 60 * 24 * 7; // session client : 7 jours

const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET manquant ou trop court.");
  return new TextEncoder().encode(s + ":client"); // clé distincte de celle de l'administration
};

export async function createClientSession(clientId: string, sessionVersion: number) {
  const t = await new SignJWT({ cid: clientId, sv: sessionVersion }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  (await cookies()).set(COOKIE, t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export async function destroyClientSession() {
  (await cookies()).delete(COOKIE);
}

/** Client connecté, compte vérifié, session non révoquée (« se déconnecter partout »). */
export async function getClient() {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const c = await db.client.findUnique({ where: { id: String(payload.cid) } });
    if (!c || !c.emailVerifiedAt || c.sessionVersion !== payload.sv) return null;
    return c;
  } catch {
    return null;
  }
}
export async function requireClient() {
  const c = await getClient();
  if (!c) redirect("/compte/connexion");
  return c;
}

/** Adresse IP tronquée (minimisation des données) : /24 en IPv4, /48 en IPv6. */
export async function truncatedIp() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim();
  if (!ip) return "";
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + "::";
  return ip.split(".").slice(0, 3).join(".") + ".0";
}
export async function rawIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}
export async function userAgent() {
  return ((await headers()).get("user-agent") || "").slice(0, 120);
}

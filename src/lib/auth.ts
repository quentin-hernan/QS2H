import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { db } from "./db";

const COOKIE = "qs2h_session";
const MAX_AGE = 60 * 60 * 8; // 8 h : session expirante

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum).");
  return new TextEncoder().encode(s);
}

/** Mot de passe initial à changer, ou propriétaire sans double authentification : l'accès est limité à « Mon compte ». */
/** 2FA obligatoire pour le propriétaire : désactivée par défaut, à réactiver en production avec ADMIN_REQUIRE_2FA=true. */
export const REQUIRE_OWNER_2FA = process.env.ADMIN_REQUIRE_2FA === "true";
export const mustSetup = (u: { mustChangePassword: boolean; role: string; totpEnabled: boolean }) => u.mustChangePassword || (REQUIRE_OWNER_2FA && u.role === "owner" && !u.totpEnabled);

export type Session = { uid: string; email: string; name: string; role: "owner" | "editor"; must: boolean };

export { hashPassword, verifyPassword, passwordIssues, checkNewPassword } from "./password";

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await db.user.findUnique({ where: { id: String(payload.uid) } });
    if (!u) return null;
    return { uid: u.id, email: u.email, name: u.name, role: u.role as Session["role"], must: mustSetup(u) };
  } catch {
    return null;
  }
}

export async function requireSession(role?: "owner") {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  if (role === "owner" && s.role !== "owner") throw new Error("FORBIDDEN");
  return s;
}

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

export async function audit(userEmail: string, action: string, entity: string, entityId?: string) {
  await db.auditLog.create({ data: { userEmail, action, entity, entityId } });
}

import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createClientSession, truncatedIp, userAgent } from "@/lib/client-auth";
import { SITE_URL } from "@/lib/utils";

const fail = (why = "google") => NextResponse.redirect(`${SITE_URL}/compte/connexion?erreur=${why}`);

/** Retour de Google : vérifie l'état, échange le code, puis ouvre (ou crée) l'espace client lié à l'adresse Google vérifiée. */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const saved = req.cookies.get("qs2h_gstate")?.value;
  if (!code || !state || !saved || state !== saved) return fail();
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: `${SITE_URL}/api/auth/google/callback`, grant_type: "authorization_code" }),
    });
    if (!r.ok) return fail();
    const { id_token } = (await r.json()) as { id_token?: string };
    // jeton reçu directement de Google en HTTPS : son contenu est fiable, on contrôle l'audience par sécurité
    const p = JSON.parse(Buffer.from(String(id_token).split(".")[1], "base64url").toString("utf8")) as { email?: string; email_verified?: boolean; given_name?: string; family_name?: string; name?: string; aud?: string };
    if (!p.email || !p.email_verified || p.aud !== process.env.GOOGLE_CLIENT_ID) return fail("email");
    const email = p.email.toLowerCase();
    let c = await db.client.findUnique({ where: { email } });
    if (!c) {
      const [first, ...rest] = (p.name || email.split("@")[0]).split(" ");
      c = await db.client.create({ data: { email, firstName: p.given_name || first || "Client", lastName: p.family_name || rest.join(" ") || "-", passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")), emailVerifiedAt: new Date() } });
    } else if (!c.emailVerifiedAt) {
      c = await db.client.update({ where: { id: c.id }, data: { emailVerifiedAt: new Date() } });
    }
    await db.clientLogin.create({ data: { clientId: c.id, email, ipTruncated: await truncatedIp(), agent: await userAgent(), success: true } });
    await db.client.update({ where: { id: c.id }, data: { lastLoginAt: new Date(), inactivityWarnedAt: null } });
    await createClientSession(c.id, c.sessionVersion);
    const res = NextResponse.redirect(`${SITE_URL}/compte`);
    res.cookies.delete("qs2h_gstate");
    return res;
  } catch (e) {
    console.error("[google]", e);
    return fail();
  }
}

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/utils";

/** Démarre la connexion Google de l'espace client (OAuth 2.0, flux « code »). */
export async function GET() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(`${SITE_URL}/compte/connexion?google=off`);
  const state = crypto.randomBytes(24).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: id, redirect_uri: `${SITE_URL}/api/auth/google/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("qs2h_gstate", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}

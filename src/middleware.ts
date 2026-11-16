import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/** Protège /admin : sans session valide, redirection vers la connexion. Ajoute noindex sur toute la zone. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const open = pathname === "/admin/login" || pathname.startsWith("/admin/invitation/");
  let ok = false;
  let must = false;
  const token = req.cookies.get("qs2h_session")?.value;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      ok = true;
      must = payload.must === true;
    } catch {}
  }
  // mot de passe initial à changer avant tout autre usage
  if (ok && must && !open && pathname !== "/admin/compte") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/compte";
    return NextResponse.redirect(url);
  }
  if (!ok && !open) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };

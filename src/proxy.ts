import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routeAccess } from "@/lib/permissions";
import type { Role } from "@/types/enums";

// Coarse, edge-fast gate (BACKEND-ARCHITECTURE.md §3.1, §3.3). Next 16 renamed the
// `middleware` convention to `proxy`. It refreshes the Supabase session (rotated cookies ride
// on `res`) and keeps the wrong role from ever reaching a page. The real refusal still happens
// server-side in the service layer (requireRole).

/** Build a redirect that preserves any session cookies the refresh just rotated onto `res`. */
function redirectWith(res: NextResponse, req: NextRequest, pathname: string, search = "") {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export async function proxy(req: NextRequest) {
  const { res, user } = await updateSession(req);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";

  // Unauthenticated → only /login is reachable.
  if (!user) {
    return isLogin ? res : redirectWith(res, req, "/login");
  }

  // Signed in → keep them off the login page.
  if (isLogin) {
    return redirectWith(res, req, "/dashboard");
  }

  // Role lives in the JWT custom claim (app_metadata.role) — no DB hit here.
  const role = (user.app_metadata?.role ?? null) as Role | null;
  if (!routeAccess(role, pathname)) {
    return redirectWith(res, req, "/dashboard", "?denied=1");
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

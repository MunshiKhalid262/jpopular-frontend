import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
* Route protection -- UX ONLY. (Next 16 renamed this convention from
 * "middleware" to "proxy"; same API.)
 *
 * This checks whether a session cookie is *present*. Presence is not proof of
 * validity: the cookie may hold a revoked or expired token. The real check is
 * Laravel returning 401, which getCurrentUser() turns into a redirect and the
 * proxy turns into a cleared cookie.
 *
 * Laravel remains the authorization authority. Nothing here grants access to
 * data; it only avoids showing a signed-out user an app shell that would fail
 * to load. See ARCHITECTURE-V1.md section 3.4.
 */

const SESSION_COOKIE = "jpopular_session";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    // Preserve where the user was heading so login can return them there.
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }

    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next internals, static assets, and the BFF routes.
   * The BFF must stay reachable: it returns JSON 401s that the client turns
   * into a redirect, and redirecting an API call to an HTML page would break
   * error handling.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

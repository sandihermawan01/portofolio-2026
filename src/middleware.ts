import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

/**
 * UX-ONLY redirect layer. The Edge runtime middleware can't verify a
 * Firebase session cookie (no Node crypto available here), so this only
 * checks whether a session cookie is *present* and redirects accordingly
 * for a nicer experience. It is NOT a security boundary — every admin
 * route handler and server action independently calls `requireAdmin()`
 * (see lib/firebase/auth.ts), which does the real, cryptographically
 * verified check. Never add admin logic here beyond this redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

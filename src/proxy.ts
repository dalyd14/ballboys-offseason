import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js 16 proxy (formerly middleware).
 *
 * Cookie-only check for optimistic redirects. This is NOT a security
 * boundary — actual auth validation happens in each page/action via
 * auth.api.getSession(). This just avoids loading protected pages for
 * unauthenticated users.
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const protectedPaths = [
    "/submit-roster",
    "/my-team",
    "/other-teams",
    "/admin",
  ];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/submit-roster/:path*",
    "/my-team/:path*",
    "/other-teams/:path*",
    "/admin/:path*",
  ],
};

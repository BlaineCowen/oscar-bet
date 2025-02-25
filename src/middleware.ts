import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth";

// Force Node.js runtime for middleware
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const cookies = getSessionCookie(request);
  if (!cookies) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/games/:path*",
    "/api/games/:path*",
    "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|/|$).*)",
  ],
};

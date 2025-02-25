import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth";

// Force Node.js runtime for middleware
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const cookies = getSessionCookie(request);
  console.log("Middleware called for path:", request.nextUrl.pathname);
  console.log("Session cookie found:", !!cookies);

  if (!cookies) {
    console.log("No session cookie, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes that require auth
    "/games",
    "/games/:path*",
    "/api/games/:path*",
    "/profile/:path*",
    // Add other protected routes as needed
  ],
};

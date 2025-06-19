import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/auth",
    "/api/auth",
    "/api/games/verify-code",
  ];

  // Allow all auth-related paths
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => path.startsWith(p)) ||
    path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/) ||
    path.includes("_next") ||
    path.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log(
      "Auth check for path:",
      path,
      "token:",
      token ? "exists" : "none"
    );

    if (!token) {
      console.log("No token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

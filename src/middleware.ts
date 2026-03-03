import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths that never need any auth
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/api/auth",
  "/api/games/verify-code",
  "/api/cron",
  // Guest game routes
  "/join",
  "/rejoin",
  "/api/join",
  "/api/rejoin",
];

// Game pages and their APIs are open to guests (participant cookie is checked inside the route)
function isGuestAllowed(path: string) {
  return (
    path.match(/^\/games\/[^/]+/) || // /games/[id]/...
    path.match(/^\/api\/games\/[^/]+\/bets/) || // /api/games/[id]/bets
    path.match(/^\/api\/games\/[^/]+\/categories/) || // payout etc
    path.match(/^\/api\/games\/[^/]+$/) // GET /api/games/[id]
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
    isGuestAllowed(path) ||
    path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/) ||
    path.includes("_next") ||
    path.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", token.id as string);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

/**
 * GET /api/me?gameId=xxx
 * Returns the current participant for a game, identified by:
 * 1. `pt` cookie (guest)
 * 2. Auth.js v5 session (logged-in user via `auth()`)
 * 3. `x-user-id` header set by middleware (fallback)
 *
 * If both a pt cookie and a session are present and the guest participant
 * has not yet been linked (userId=null), it is lazily linked here.
 * This handles the "joined as guest, then logged in" case without requiring
 * the user to re-register.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { linkGuestParticipant, PT_COOKIE_OPTS } from "@/lib/link-guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ participant: null });

  const includeOpts = {
    bets: { include: { nominee: { include: { category: true } } } },
    user: { select: { id: true, name: true, email: true, image: true } },
  };

  const pt = req.cookies.get("pt")?.value;
  const session = await auth();
  const userId =
    session?.user?.id ?? req.headers.get("x-user-id") ?? null;

  // If we have both a pt cookie AND a logged-in session, try to link the guest
  // participant to the auth account. This is the lazy-link path for users who
  // joined as a guest and later logged in (or registered in another tab).
  if (pt && userId) {
    const linkedGameId = await linkGuestParticipant(pt, userId);
    if (linkedGameId) {
      // Successfully linked — fetch the now-linked participant and clear the cookie
      const participant = await prisma.gameParticipant.findFirst({
        where: { userId, gameId },
        include: includeOpts,
      });
      const res = NextResponse.json({ participant });
      res.cookies.set("pt", "", { ...PT_COOKIE_OPTS, maxAge: 0 });
      return res;
    }
  }

  // 1. Guest cookie (not yet linked)
  if (pt) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { token: pt, gameId },
      include: includeOpts,
    });
    if (participant) {
      return NextResponse.json({
        participant: {
          ...participant,
          user: participant.user ?? {
            id: participant.id,
            name: participant.name,
            email: null,
          },
        },
      });
    }
  }

  // 2. Logged-in user
  if (userId) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { userId, gameId },
      include: includeOpts,
    });
    if (participant) {
      return NextResponse.json({ participant });
    }
  }

  return NextResponse.json({ participant: null });
}

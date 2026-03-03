import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { linkGuestParticipant, PT_COOKIE_OPTS } from "@/lib/link-guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params;

  const participant = await prisma.gameParticipant.findUnique({
    where: { token },
    select: { gameId: true, userId: true },
  });

  if (!participant) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const gameUrl = new URL(`/games/${participant.gameId}`, request.url);

  // If the visitor is logged in, link the guest participant to their account
  // instead of just setting the pt cookie. This covers the case where a user
  // clicks their rejoin link after having registered an account.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (userId && participant.userId === null) {
    const linkedGameId = await linkGuestParticipant(token, userId);
    if (linkedGameId) {
      // Linked — redirect to game without setting the (now-stale) pt cookie,
      // and clear any existing pt cookie from the browser.
      const res = NextResponse.redirect(gameUrl);
      res.cookies.set("pt", "", { ...PT_COOKIE_OPTS, maxAge: 0 });
      return res;
    }
  }

  // Guest (not logged in) or already-linked participant — restore pt cookie
  // Only set the cookie if the participant still has a token (not yet linked)
  if (participant.userId === null) {
    const res = NextResponse.redirect(gameUrl);
    res.cookies.set("pt", token, {
      ...PT_COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  // Participant already linked to an account (userId set, token cleared)
  // Just redirect to the game — the auth session will identify them.
  return NextResponse.redirect(gameUrl);
}

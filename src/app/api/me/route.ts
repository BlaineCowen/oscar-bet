/**
 * GET /api/me?gameId=xxx
 * Returns the current participant for a game, identified by:
 * 1. `pt` cookie (guest)
 * 2. Auth.js v5 session (logged-in user via `auth()`)
 * 3. `x-user-id` header set by middleware (fallback)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ participant: null });

  const includeOpts = {
    bets: { include: { nominee: { include: { category: true } } } },
    user: { select: { id: true, name: true, email: true, image: true } },
  };

  // 1. Guest cookie
  const pt = req.cookies.get("pt")?.value;
  if (pt) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { token: pt, gameId },
      include: includeOpts,
    });
    if (participant) {
      return NextResponse.json({
        participant: {
          ...participant,
          user: participant.user ?? { id: participant.id, name: participant.name, email: null },
        },
      });
    }
  }

  // 2. Auth.js v5 session (works in Node.js API routes, unlike getToken from next-auth/jwt v4)
  const session = await auth();
  const userId = session?.user?.id ?? req.headers.get("x-user-id");

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

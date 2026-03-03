/**
 * GET /api/me?gameId=xxx
 * Returns the current participant for a game, identified by:
 * 1. `pt` cookie (guest)
 * 2. `x-user-id` header (admin / logged-in user)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

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

  // 2. Logged-in user — always try this even if pt cookie exists but didn't match
  const authToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (authToken?.id) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { userId: authToken.id as string, gameId },
      include: includeOpts,
    });
    if (participant) {
      return NextResponse.json({ participant });
    }
  }

  return NextResponse.json({ participant: null });
}

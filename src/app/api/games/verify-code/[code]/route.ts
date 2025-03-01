import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Verify a join code and return basic game information
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  try {
    const { code } = params;
    console.log("Verifying code:", code);

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      );
    }

    // Find game with this code that hasn't expired
    const game = await prisma.game.findFirst({
      where: {
        joinCode: code,
        joinCodeExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        adminId: true,
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
        startDate: true,
        endDate: true,
        locked: true,
        joinCode: true,
        joinCodeExpiresAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    console.log("Found game for code:", game);

    if (
      !game ||
      !game.joinCode ||
      !game.joinCodeExpiresAt ||
      game.joinCodeExpiresAt < new Date()
    ) {
      console.log("Invalid or expired code:", {
        hasGame: !!game,
        hasJoinCode: !!game?.joinCode,
        expiresAt: game?.joinCodeExpiresAt,
      });
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 }
      );
    }

    // Check if game is full
    if (game._count.participants >= 100) {
      return NextResponse.json(
        { error: "Game has reached maximum capacity of 100 players" },
        { status: 400 }
      );
    }

    // Remove _count from response
    const { _count, ...gameWithoutCount } = game;
    return NextResponse.json(gameWithoutCount);
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}

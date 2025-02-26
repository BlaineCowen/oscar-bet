import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
// Route configuration
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate a random 6-character code
function generateJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

const joinSchema = z.object({
  code: z.string().length(6),
});

// POST - Generate a new join code
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.adminId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = generateJoinCode();
    await prisma.game.update({
      where: { id },
      data: {
        joinCode: code,
        joinCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Failed to generate join code:", error);
    return NextResponse.json(
      { error: "Failed to generate join code" },
      { status: 500 }
    );
  }
}

// PUT - Join a game with a code
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    const userId = request.headers.get("x-user-id");
    const body = await request.json();
    const { code } = body;

    console.log("Join request:", { gameId: id, userId, code });

    if (!userId) {
      console.error("No user ID provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the game exists and the join code is valid
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        participants: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    console.log("Found game:", {
      gameId: game?.id,
      hasParticipants: game?.participants.length,
      joinCode: game?.joinCode,
      joinCodeExpiresAt: game?.joinCodeExpiresAt,
    });

    if (!game) {
      console.error("Game not found");
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.participants.length > 0) {
      console.log("User already joined game");
      return NextResponse.json(
        { error: "You have already joined this game" },
        { status: 400 }
      );
    }

    if (
      game.joinCode !== code ||
      !game.joinCodeExpiresAt ||
      game.joinCodeExpiresAt < new Date()
    ) {
      console.error("Invalid or expired join code");
      return NextResponse.json(
        { error: "Invalid or expired join code" },
        { status: 400 }
      );
    }

    // Add user as participant
    console.log("Adding user as participant");
    const participant = await prisma.gameParticipant.create({
      data: {
        userId,
        gameId: id,
        balance: 1000, // Default balance for new participants
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("Successfully added participant:", participant);

    return NextResponse.json({
      message: "Successfully joined game",
      participant,
    });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }
}

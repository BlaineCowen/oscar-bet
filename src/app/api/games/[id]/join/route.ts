import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = joinSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const { code } = result.data;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.participants.length > 0) {
      return NextResponse.json(
        { error: "Already joined this game" },
        { status: 400 }
      );
    }

    if (
      !game.joinCode ||
      game.joinCode !== code ||
      !game.joinCodeExpiresAt ||
      game.joinCodeExpiresAt < new Date()
    ) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const participant = await prisma.gameParticipant.create({
      data: {
        userId,
        gameId: id,
        balance: game.initialBalance,
      },
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Failed to join game:", error);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }
}

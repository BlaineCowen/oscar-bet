import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const betSchema = z.object({
  nomineeId: z.string(),
  amount: z.number().positive(),
  categoryId: z.string(),
});

const betsSchema = z.object({
  bets: z.array(betSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: gameId } = params;
    const body = await req.json();
    const { bets } = betsSchema.parse(body);

    // Get the game and participant in a single query
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const participant = game.participants[0];
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this game" },
        { status: 403 }
      );
    }

    // Calculate total bet amount
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBetAmount > participant.balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create all bets and update participant balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create all bets
      await tx.bet.createMany({
        data: bets.map((bet) => ({
          amount: bet.amount,
          nomineeId: bet.nomineeId,
          gameId,
          userId,
          gameParticipantId: participant.id,
        })),
      });

      // Update participant balance
      await tx.gameParticipant.update({
        where: { id: participant.id },
        data: {
          balance: participant.balance - totalBetAmount,
        },
      });

      // Return updated participant for the response
      return tx.gameParticipant.findUnique({
        where: { id: participant.id },
        include: {
          bets: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error placing bets:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to place bets" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... existing code ...

  const { id: gameId } = params;

  // ... existing code ...
}

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Route configuration
export const dynamic = "force-dynamic";
export const revalidate = 0;

const betSchema = z.object({
  nomineeId: z.string(),
  amount: z.number().positive(),
  categoryId: z.string(),
});

const betsSchema = z.object({
  bets: z.array(betSchema),
});

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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
          include: {
            bets: true,
          },
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
    const currentBetsTotal = participant.bets.reduce(
      (sum, bet) => sum + bet.amount,
      0
    );
    const balanceAfterUpdate =
      participant.balance + currentBetsTotal - totalBetAmount;

    if (balanceAfterUpdate < 0) {
      return NextResponse.json(
        { error: "Insufficient balance for update" },
        { status: 400 }
      );
    }

    // Update all bets and participant balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing bets
      await tx.bet.deleteMany({
        where: {
          gameId,
          userId,
        },
      });

      // Create new bets
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
      return tx.gameParticipant.update({
        where: { id: participant.id },
        data: {
          balance: balanceAfterUpdate,
        },
        include: {
          bets: {
            include: {
              nominee: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    });

    // Return with the properly structured data
    if (!result) {
      return NextResponse.json(
        { error: "Failed to update participant data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      participant: result,
      bets: result.bets,
    });
  } catch (error) {
    console.error("Error updating bets:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update bets" },
      { status: 500 }
    );
  }
}

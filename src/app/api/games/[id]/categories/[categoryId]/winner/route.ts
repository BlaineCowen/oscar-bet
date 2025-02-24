import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string; categoryId: string }> }
) {
  const params = await props.params;
  try {
    const { id: gameId, categoryId } = params;
    const { nomineeId } = await req.json();

    if (!nomineeId) {
      return NextResponse.json(
        { error: "Nominee ID is required" },
        { status: 400 }
      );
    }

    // Get the game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.locked) {
      return NextResponse.json(
        { error: "Game must be locked before setting winners" },
        { status: 400 }
      );
    }

    // 1. Update the category with the winner
    const [updatedCategory, winningNominee] = await Promise.all([
      prisma.category.update({
        where: { id: categoryId },
        data: {
          winnerId: nomineeId,
        },
        include: {
          nominees: true,
        },
      }),
      prisma.nominee.findUnique({
        where: { id: nomineeId },
      }),
    ]);

    if (!winningNominee) {
      return NextResponse.json(
        { error: "Winning nominee not found" },
        { status: 404 }
      );
    }

    // 2. Find all bets for this category
    const bets = await prisma.bet.findMany({
      where: {
        gameId,
        nominee: {
          categoryId,
        },
      },
      include: {
        nominee: true,
        gameParticipant: true,
      },
    });

    console.log(`Processing ${bets.length} bets for category ${categoryId}`);

    // 3. Process each bet - update balances and mark bets as paid out
    for (const bet of bets) {
      const isWinningBet = bet.nomineeId === nomineeId;
      const payoutAmount = isWinningBet
        ? bet.amount * bet.nominee.odds - bet.amount // Net winnings (minus the original bet)
        : -bet.amount; // Loss is the negative of the bet amount

      console.log(
        `Bet ${bet.id}: ${
          isWinningBet ? "Won" : "Lost"
        }, payout: ${payoutAmount}`
      );

      // Update the bet to mark it as paid out
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          paidOut: true,
          payoutAmount,
        },
      });

      // Update participant balance if this is a winning bet
      if (isWinningBet) {
        await prisma.gameParticipant.update({
          where: { id: bet.gameParticipantId },
          data: {
            balance: {
              increment: bet.amount * bet.nominee.odds, // Add winnings including original bet
            },
          },
        });
        console.log(
          `Updated balance for participant ${bet.gameParticipantId}, added ${
            bet.amount * bet.nominee.odds
          }`
        );
      }
    }

    // 4. Get updated game data to return
    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        categories: {
          include: {
            nominees: true,
            winner: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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
        },
      },
    });

    // Log information about the updated game for debugging
    console.log(
      `Updated game data ready. Categories: ${updatedGame?.categories.length}`
    );
    console.log(`Category ${categoryId} winner set to nominee ${nomineeId}`);

    // Log participants and balances
    updatedGame?.participants.forEach((p) => {
      console.log(`Participant ${p.userId} balance: ${p.balance}`);
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Failed to set category winner:", error);
    return NextResponse.json(
      { error: "Failed to set category winner" },
      { status: 500 }
    );
  }
}

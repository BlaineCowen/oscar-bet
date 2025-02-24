import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";



// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    const { categoryId, winner } = await req.json();

    // Get all participants with their bets for this category
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            bets: {
              include: {
                nominee: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get the winning nominee with its odds
    const winningNominee = await prisma.nominee.findFirst({
      where: {
        categoryId,
        name: winner,
      },
    });

    if (!winningNominee) {
      return NextResponse.json({ error: "Winner not found" }, { status: 404 });
    }

    // Start a transaction to update category winner and process payouts
    await prisma.$transaction(async (tx) => {
      // Set the category winner
      await tx.category.update({
        where: { id: categoryId },
        data: { winner },
      });

      // Process payouts for each participant
      await Promise.all(
        game.participants.map((participant) => {
          const winningBet = participant.bets.find(
            (bet) => bet.nominee.name === winner
          );

          const payout = winningBet
            ? Math.round(winningBet.amount * winningNominee.odds)
            : 0;

          return tx.gameParticipant.update({
            where: { id: participant.id },
            data: {
              balance: {
                increment: payout,
              },
            },
          });
        })
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing winner and payouts:", error);
    return NextResponse.json(
      { error: "Failed to process winner and payouts" },
      { status: 500 }
    );
  }
}

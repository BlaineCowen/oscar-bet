import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { effectiveOdds as toEffectiveOdds } from "@/lib/kalshi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Process payouts for a single game category given a winning nominee name. */
async function processPayouts(
  gameId: string,
  categoryId: string,
  winningNomineeId: string,
  winningNomineeName: string
) {
  // Find the actual winning nominee in this specific game/category (match by name)
  const nominee = await prisma.nominee.findFirst({
    where: { categoryId, name: winningNomineeName },
  });
  if (!nominee) return;

  // Set the winner on the category
  await prisma.category.update({
    where: { id: categoryId },
    data: { winnerId: nominee.id },
  });

  // Find all bets for this category in this game
  const bets = await prisma.bet.findMany({
    where: {
      gameId,
      nominee: { categoryId },
    },
    include: { nominee: true, gameParticipant: true },
  });

  for (const bet of bets) {
    const isWin = bet.nomineeId === nominee.id;
    const multiplier = toEffectiveOdds(bet.oddsAtTime ?? bet.nominee.odds);
    const payoutAmount = isWin
      ? bet.amount * multiplier - bet.amount
      : -bet.amount;

    await prisma.bet.update({
      where: { id: bet.id },
      data: { paidOut: true, payoutAmount },
    });

    if (isWin) {
      await prisma.gameParticipant.update({
        where: { id: bet.gameParticipantId },
        data: { balance: { increment: bet.amount * multiplier } },
      });
    }
  }
}

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

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    if (!game.locked) {
      return NextResponse.json(
        { error: "Game must be locked before setting winners" },
        { status: 400 }
      );
    }

    // Resolve the winning nominee in this game
    const winningNominee = await prisma.nominee.findUnique({
      where: { id: nomineeId },
      include: { category: true },
    });
    if (!winningNominee) {
      return NextResponse.json(
        { error: "Winning nominee not found" },
        { status: 404 }
      );
    }

    const categoryName = winningNominee.category.name;
    const winnerName = winningNominee.name;

    // 1. Process this game's category
    await processPayouts(gameId, categoryId, nomineeId, winnerName);

    // 2. Propagate to all other locked games by the same admin
    const otherGames = await prisma.game.findMany({
      where: {
        adminId: game.adminId,
        locked: true,
        id: { not: gameId },
      },
      include: {
        categories: {
          where: { name: categoryName },
          include: { nominees: true },
        },
      },
    });

    for (const otherGame of otherGames) {
      for (const otherCategory of otherGame.categories) {
        // Skip if winner already set
        if (otherCategory.winnerId) continue;
        await processPayouts(
          otherGame.id,
          otherCategory.id,
          "", // not used when matching by name
          winnerName
        );
      }
    }

    // Return updated game data for the current game
    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        categories: {
          include: { nominees: true, winner: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            bets: { include: { nominee: { include: { category: true } } } },
          },
        },
      },
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

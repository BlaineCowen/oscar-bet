import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { effectiveOdds } from "@/lib/kalshi";



// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await context.params;
    const body = await req.json();
    const { bets } = betsSchema.parse(body);

    // Identify participant: try guest cookie first, then fall back to auth userId
    const pt = req.cookies.get("pt")?.value;
    const userId = req.headers.get("x-user-id");

    let participant =
      (pt
        ? await prisma.gameParticipant.findFirst({ where: { token: pt, gameId } })
        : null) ??
      (userId
        ? await prisma.gameParticipant.findFirst({ where: { userId, gameId } })
        : null);

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this game" },
        { status: 403 }
      );
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Calculate total bet amount
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBetAmount > participant.balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Look up current odds for each nominee so we can lock them in (never store < 1.01 or 0)
    const nomineeIds = [...new Set(bets.map((b) => b.nomineeId))];
    const nominees = await prisma.nominee.findMany({
      where: { id: { in: nomineeIds } },
      select: { id: true, odds: true },
    });
    const oddsById = new Map(
      nominees.map((n) => [n.id, effectiveOdds(n.odds)])
    );

    // Create all bets and update participant balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create all bets with odds locked in at placement time
      await tx.bet.createMany({
        data: bets.map((bet) => ({
          amount: bet.amount,
          oddsAtTime: oddsById.get(bet.nomineeId) ?? null,
          nomineeId: bet.nomineeId,
          gameId,
          userId: participant.userId ?? undefined,
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

    // Return participant and bets with necessary data for the client
    if (!result) {
      return NextResponse.json(
        { error: "Failed to retrieve updated participant data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      participant: result,
      bets: result.bets,
    });
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

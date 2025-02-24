import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Nominee } from "@prisma/client";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    const { name, nominees } = await req.json();

    if (!name || !nominees?.length) {
      return NextResponse.json(
        { error: "Category name and nominees are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        gameId: id,
        nominees: {
          create: nominees.map((nominee: { name: string; odds: number }) => ({
            name: nominee.name,
            odds: nominee.odds,
          })),
        },
      },
      include: {
        nominees: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    // We don't need the game ID for this endpoint
    const { categoryId, winner } = await req.json();

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { winner },
      include: {
        nominees: true,
      },
    });

    // Update bets for this category
    const bets = await prisma.bet.findMany({
      where: {
        nominee: {
          categoryId: categoryId,
        },
      },
    });

    // Update each bet's status and participant balance
    for (const bet of bets) {
      const nominee = category.nominees.find(
        (n: Nominee) => n.id === bet.nomineeId
      );
      if (!nominee) continue;

      const isWinner = nominee.id === winner;
      if (isWinner) {
        const participant = await prisma.gameParticipant.findUnique({
          where: { id: bet.gameParticipantId },
        });

        if (participant) {
          const winnings = bet.amount * nominee.odds;
          await prisma.gameParticipant.update({
            where: { id: bet.gameParticipantId },
            data: {
              balance: {
                increment: winnings,
              },
            },
          });
        }
      }
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

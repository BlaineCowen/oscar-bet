import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { use } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            nominees: true,
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
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = request.headers.get("x-user-id");

    // Check if user is authorized to delete the game
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the game and make sure the user is the admin
    const game = await prisma.game.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.adminId !== userId) {
      return NextResponse.json(
        { error: "Only the game admin can delete this game" },
        { status: 403 }
      );
    }

    // Delete all related data in the correct order
    await prisma.$transaction(async (tx) => {
      // Delete all bets for this game
      await tx.bet.deleteMany({ where: { gameId: id } });

      // Delete all game participants
      await tx.gameParticipant.deleteMany({ where: { gameId: id } });

      // Delete nominees for this game's categories
      await tx.nominee.deleteMany({
        where: { category: { gameId: id } },
      });

      // Delete categories for this game
      await tx.category.deleteMany({ where: { gameId: id } });

      // Finally delete the game
      await tx.game.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Game deleted" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}

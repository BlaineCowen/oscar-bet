import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

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

    // Find the game to get the adminId
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Lock ALL games owned by this admin
    await prisma.game.updateMany({
      where: { adminId: game.adminId },
      data: { locked: true },
    });

    // Return the specific game with full data
    const updatedGame = await prisma.game.findUnique({
      where: { id },
      include: {
        categories: { include: { nominees: true } },
        participants: {
          include: {
            user: true,
            bets: { include: { nominee: { include: { category: true } } } },
          },
        },
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Failed to lock game:", error);
    return NextResponse.json({ error: "Failed to lock game" }, { status: 500 });
  }
}

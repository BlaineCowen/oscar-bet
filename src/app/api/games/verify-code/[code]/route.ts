import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Verify a join code and return basic game information
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      );
    }

    // Find game with this code that hasn't expired
    const game = await prisma.game.findFirst({
      where: {
        joinCode: code,
        joinCodeExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        adminId: true,
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
        startDate: true,
        endDate: true,
        locked: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}

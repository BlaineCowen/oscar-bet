import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import predictions from "@/lib/oscars_predictions.json";
import { getNomineeName, convertOddsToDecimal } from "@/lib/game-utils";

// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      where: {
        OR: [
          { adminId: userId },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        categories: {
          include: {
            nominees: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const game = await prisma.game.create({
      data: {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        initialBalance: body.initialBalance,
        adminId: userId,
        participants: {
          create: {
            userId,
            balance: body.initialBalance,
          },
        },
        categories: {
          create: predictions.map((category) => ({
            name: category.category.replace("  (more info)", ""),
            nominees: {
              create: category.predictions.map((nominee) => ({
                name: getNomineeName(nominee),
                odds: convertOddsToDecimal(nominee.odds),
              })),
            },
          })),
        },
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        categories: {
          include: {
            nominees: true,
          },
        },
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Failed to create game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

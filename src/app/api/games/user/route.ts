import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("Failed to fetch user games:", error);
    return NextResponse.json(
      { error: "Failed to fetch user games" },
      { status: 500 }
    );
  }
}

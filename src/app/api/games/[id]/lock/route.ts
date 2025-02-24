import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params;
    const game = await prisma.game.update({
      where: { id },
      data: { locked: true },
      include: {
        categories: {
          include: {
            nominees: true,
          },
        },
        participants: {
          include: {
            user: true,
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

    return NextResponse.json(game);
  } catch (error) {
    console.error("Failed to lock game:", error);
    return NextResponse.json({ error: "Failed to lock game" }, { status: 500 });
  }
}

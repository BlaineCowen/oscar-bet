import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }

    const game = await prisma.game.findFirst({
      where: { adminId: userId },
    });

    return NextResponse.json({ isAdmin: !!game });
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return NextResponse.json({ isAdmin: false });
  }
}

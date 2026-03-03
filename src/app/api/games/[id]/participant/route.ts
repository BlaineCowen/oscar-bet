import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/games/[id]/participant  { name: string } */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await props.params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : null;

  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json(
      { error: "Name must be 1–50 characters" },
      { status: 400 }
    );
  }

  // Identify participant: pt cookie (guest) or session (auth user)
  const pt = req.cookies.get("pt")?.value;
  if (pt) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { token: pt, gameId },
    });
    if (participant) {
      const updated = await prisma.gameParticipant.update({
        where: { id: participant.id },
        data: { name },
      });
      return NextResponse.json({ name: updated.name });
    }
  }

  const session = await auth();
  const userId = session?.user?.id ?? req.headers.get("x-user-id");
  if (userId) {
    const participant = await prisma.gameParticipant.findFirst({
      where: { userId, gameId },
    });
    if (participant) {
      const updated = await prisma.gameParticipant.update({
        where: { id: participant.id },
        data: { name },
      });
      return NextResponse.json({ name: updated.name });
    }
  }

  return NextResponse.json({ error: "Participant not found" }, { status: 404 });
}

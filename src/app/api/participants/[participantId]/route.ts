import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { participantId: string } }
) {
  try {
    const { name } = await request.json();
    const participant = await prisma.gameParticipant.update({
      where: { id: params.participantId },
      data: {
        user: {
          update: {
            name,
          },
        },
      },
    });
    return NextResponse.json(participant);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
}

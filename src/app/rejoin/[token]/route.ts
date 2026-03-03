import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  const { token } = await props.params;

  const participant = await prisma.gameParticipant.findUnique({
    where: { token },
    select: { gameId: true },
  });

  if (!participant) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const res = NextResponse.redirect(new URL(`/games/${participant.gameId}`, request.url));
  res.cookies.set("pt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}

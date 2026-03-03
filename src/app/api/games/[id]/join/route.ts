import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function generateParticipantToken() {
  return crypto.randomBytes(32).toString("hex");
}

// POST - Admin generates a new join code for the game
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.adminId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = generateJoinCode();
  await prisma.game.update({
    where: { id },
    data: {
      joinCode: code,
      joinCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({ code });
}

// PUT - Guest joins a game: { code, name }  →  sets participant cookie
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  const body = await request.json();
  const { code, name } = body as { code?: string; name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Check existing participant cookie — if they already joined this game, just restore
  const existingToken = request.cookies.get("pt")?.value;
  if (existingToken) {
    const existing = await prisma.gameParticipant.findFirst({
      where: { token: existingToken, gameId: id },
    });
    if (existing) {
      const res = NextResponse.json({ gameId: id, participantId: existing.id });
      res.cookies.set("pt", existingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      return res;
    }
  }

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  if (
    !game.joinCode ||
    game.joinCode !== code ||
    !game.joinCodeExpiresAt ||
    game.joinCodeExpiresAt < new Date()
  ) {
    return NextResponse.json({ error: "Invalid or expired join code" }, { status: 400 });
  }

  const participantCount = await prisma.gameParticipant.count({ where: { gameId: id } });
  if (participantCount >= 100) {
    return NextResponse.json({ error: "Game is full (100 players max)" }, { status: 400 });
  }

  const token = generateParticipantToken();
  const participant = await prisma.gameParticipant.create({
    data: {
      gameId: id,
      balance: game.initialBalance,
      name: name.trim(),
      token,
    },
  });

  const res = NextResponse.json({ gameId: id, participantId: participant.id });
  res.cookies.set("pt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return res;
}

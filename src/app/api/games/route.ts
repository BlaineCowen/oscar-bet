import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllOscarCategories } from "@/lib/kalshi";
import type { KalshiCategory } from "@/lib/kalshi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCachedCategories(): Promise<KalshiCategory[]> {
  // Try the DB cache first (populated by cron)
  const cached = await prisma.kalshiCache.findUnique({
    where: { id: "singleton" },
  });

  if (cached) {
    const data = cached.data as KalshiCategory[];
    if (Array.isArray(data) && data.length > 0) {
      console.log(
        `Using KalshiCache (${data.length} categories, updated ${cached.updatedAt.toISOString()})`
      );
      return data;
    }
  }

  // Cache is empty → fall back to live fetch and populate cache
  console.log("KalshiCache empty, fetching live from Kalshi...");
  const categories = await fetchAllOscarCategories();

  if (categories.length > 0) {
    await prisma.kalshiCache.upsert({
      where: { id: "singleton" },
      update: { data: categories as any },
      create: { id: "singleton", data: categories as any },
    });
  }

  return categories;
}

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
          { participants: { some: { userId } } },
        ],
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        categories: { include: { nominees: true } },
      },
      orderBy: { createdAt: "desc" },
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
    const categories = await getCachedCategories();

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "No Oscar categories available. Try again in a moment." },
        { status: 502 }
      );
    }

    const game = await prisma.game.create({
      data: {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        initialBalance: Number(body.initialBalance),
        adminId: userId,
        participants: {
          create: { userId, balance: Number(body.initialBalance) },
        },
        categories: {
          create: categories.map((cat) => ({
            name: cat.category,
            nominees: {
              create: cat.nominees.map((nominee) => ({
                name: nominee.name,
                odds: nominee.odds,
                kalshiTicker: nominee.kalshiTicker,
                imageUrl: nominee.imageUrl,
              })),
            },
          })),
        },
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        categories: { include: { nominees: true } },
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

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllOscarCategories, fetchFreshOdds } from "@/lib/kalshi";
import type { KalshiCategory } from "@/lib/kalshi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // no secret set → open (dev only)
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * Shared logic used by both the cron GET and the manual POST.
 * 1. Fetches all categories from Kalshi (batched, rate-limit-safe).
 * 2. Stores the full snapshot in KalshiCache.
 * 3. Updates odds + imageUrl on every active nominee in the DB.
 */
async function runSync(): Promise<{
  cached: number;
  updatedNominees: number;
  skippedNominees: number;
}> {
  // --- 1. Fetch fresh data from Kalshi ---
  const categories: KalshiCategory[] = await fetchAllOscarCategories();

  // --- 2. Persist snapshot to KalshiCache ---
  await prisma.kalshiCache.upsert({
    where: { id: "singleton" },
    update: { data: categories as any },
    create: { id: "singleton", data: categories as any },
  });

  // --- 3. Update odds on existing nominees in active (unlocked) games ---
  // Collect all kalshiTickers from the fresh data
  const freshMap = new Map<string, { odds: number; imageUrl: string | null }>();
  for (const cat of categories) {
    for (const nom of cat.nominees) {
      freshMap.set(nom.kalshiTicker, { odds: nom.odds, imageUrl: nom.imageUrl });
    }
  }

  // Only update nominees in unlocked games whose category isn't locked
  const nominees = await prisma.nominee.findMany({
    where: {
      kalshiTicker: { not: null },
      category: {
        isLocked: false,
        game: { locked: false },
      },
    },
    select: { id: true, kalshiTicker: true },
  });

  let updatedNominees = 0;
  let skippedNominees = 0;

  await Promise.all(
    nominees.map(async (n) => {
      const fresh = n.kalshiTicker ? freshMap.get(n.kalshiTicker) : undefined;
      if (!fresh) {
        skippedNominees++;
        return;
      }
      await prisma.nominee.update({
        where: { id: n.id },
        data: {
          odds: fresh.odds,
          ...(fresh.imageUrl !== null ? { imageUrl: fresh.imageUrl } : {}),
        },
      });
      updatedNominees++;
    })
  );

  return { cached: categories.length, updatedNominees, skippedNominees };
}

// Vercel Cron calls GET
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSync();
    console.log("sync-odds (cron):", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("sync-odds failed:", error);
    return NextResponse.json({ error: "Failed to sync odds" }, { status: 500 });
  }
}

// Manual trigger via POST (e.g. from admin UI or first-run setup)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSync();
    console.log("sync-odds (manual):", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("sync-odds failed:", error);
    return NextResponse.json({ error: "Failed to sync odds" }, { status: 500 });
  }
}

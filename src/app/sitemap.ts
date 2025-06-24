import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import type { Game } from "@prisma/client";

type GameSitemapEntry = Pick<Game, "id" | "updatedAt">;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://oscaraction.com";
  let games: GameSitemapEntry[] = [];

  try {
    // Get all public games
    games = await prisma.game.findMany({
      where: {
        locked: false,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch games for sitemap:", error);
    // Continue with empty games array
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...games.map((game) => ({
      url: `${baseUrl}/games/${game.id}`,
      lastModified: game.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.9,
    })),
  ];
}

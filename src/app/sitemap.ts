import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all public games
  const games = await prisma.game.findMany({
    where: {
      locked: false,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const baseUrl = "https://oscaraction.com";

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

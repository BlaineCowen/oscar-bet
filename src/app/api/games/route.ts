import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import predictions from "@/lib/oscars_predictions.json";
import {
  getNomineeName,
  convertOddsToDecimal,
  getNomineeMovie,
} from "@/lib/game-utils";
import { getUpdatedNominees } from "@/lib/scrapeOdds";

// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Define types for the JSON data structure
interface BaseNominee {
  position: string;
  image: string;
  odds: string;
}

interface NameNominee extends BaseNominee {
  name: string;
}

interface ActorMovieNominee extends BaseNominee {
  actor: string;
  movie: string;
}

type Nominee = NameNominee | ActorMovieNominee;

interface Category {
  category: string;
  predictions: Nominee[];
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
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        categories: {
          include: {
            nominees: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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

    // Get fresh odds with fallback to original predictions
    let scrapedNominees = [];
    try {
      scrapedNominees = await getUpdatedNominees();
      if (!scrapedNominees || scrapedNominees.length === 0) {
        console.log("No nominees scraped, using original odds");
        return createGameWithOriginalOdds(body, userId);
      }
    } catch (error) {
      console.error("Failed to scrape odds, using original odds:", error);
      return createGameWithOriginalOdds(body, userId);
    }

    // Create a map for quick lookup of scraped odds
    const oddsMap = new Map(
      scrapedNominees.map((nominee) => [
        `${nominee.category.trim()}:${nominee.name.trim()}`,
        nominee.odds,
      ])
    );

    // Merge scraped odds with original data
    const mergedNominees = (predictions as Category[]).map((category) => {
      try {
        // First check if we can match all nominees in this category
        const allNomineesMatchable = category.predictions.every((nominee) => {
          try {
            let nomineeName = "";
            if ("name" in nominee) {
              nomineeName = nominee.name;
            } else if ("actor" in nominee && "movie" in nominee) {
              nomineeName = nominee.actor;
            }

            const key = `${category.category
              .replace(/\s*\(more info\)/i, "")
              .trim()}:${nomineeName.trim()}`;

            return oddsMap.has(key);
          } catch (error) {
            console.error(
              `Error matching nominee in ${category.category}:`,
              error
            );
            return false;
          }
        });

        // If we can't match all nominees, return category with original odds
        if (!allNomineesMatchable) {
          console.log(
            `Category ${category.category} has unmatched nominees, keeping original odds`
          );
          return category;
        }

        // If all nominees match, update odds for the category
        return {
          ...category,
          predictions: category.predictions.map((nominee) => {
            try {
              let nomineeName = "";
              if ("name" in nominee) {
                nomineeName = nominee.name;
              } else if ("actor" in nominee && "movie" in nominee) {
                nomineeName = nominee.actor;
              }

              const key = `${category.category
                .replace(/\s*\(more info\)/i, "")
                .trim()}:${nomineeName.trim()}`;
              const scrapedOdds = oddsMap.get(key);

              if (!scrapedOdds) {
                console.log(
                  `No odds found for ${nomineeName}, using original odds`
                );
                return nominee;
              }

              return {
                ...nominee,
                odds: scrapedOdds,
              };
            } catch (error) {
              console.error(
                `Error updating odds for nominee ${
                  "name" in nominee
                    ? nominee.name
                    : "actor" in nominee
                    ? nominee.actor
                    : "unknown"
                }:`,
                error
              );
              return nominee;
            }
          }),
        };
      } catch (error) {
        console.error(`Error processing category ${category.category}:`, error);
        return category;
      }
    });

    // create a functino that checks to make sure all the odds are valid
    const validOdds = mergedNominees.every((category) => {
      return category.predictions.every((nominee) => {
        return Number(convertOddsToDecimal(nominee.odds)) > 0;
      });
    });

    if (!validOdds) {
      console.log("Invalid odds, using original odds");
      return createGameWithOriginalOdds(body, userId);
    } else {
      // Create game using the merged nominees data
      return createGame(body, userId, mergedNominees);
    }
  } catch (error) {
    console.error("Failed to create game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

// Helper function to create game with original odds
async function createGameWithOriginalOdds(body: any, userId: string) {
  return createGame(body, userId, predictions as Category[]);
}

// Helper function to create game
async function createGame(body: any, userId: string, nominees: Category[]) {
  try {
    const game = await prisma.game.create({
      data: {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        initialBalance: Number(body.initialBalance),
        adminId: userId,
        participants: {
          create: {
            userId,
            balance: Number(body.initialBalance),
          },
        },
        categories: {
          create: nominees.map((category) => ({
            name: category.category.replace("  (more info)", ""),
            nominees: {
              create: category.predictions.map((nominee) => ({
                name: getNomineeName(nominee),
                movie: getNomineeMovie(nominee),
                odds: Number(convertOddsToDecimal(nominee.odds)),
              })),
            },
          })),
        },
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        categories: {
          include: {
            nominees: true,
          },
        },
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

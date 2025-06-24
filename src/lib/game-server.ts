import { prisma } from "./prisma";
import oscarPredictions from "./oscars_predictions.json";
import { getNomineeName, convertOddsToDecimal } from "./game-utils";

export async function createNewGame({
  name,
  startDate,
  endDate,
  initialBalance,
  adminId,
}: {
  name: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  adminId: string;
}) {
  try {
    const game = await prisma.game.create({
      data: {
        name,
        startDate,
        endDate,
        initialBalance,
        adminId,
        categories: {
          create: oscarPredictions.map((category) => ({
            name: category.category.replace("  (more info)", ""),
            nominees: {
              create: category.predictions.map((nominee) => ({
                name: getNomineeName(nominee),
                odds: convertOddsToDecimal(nominee.odds),
              })),
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            nominees: true,
          },
        },
      },
    });

    return game;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

export async function joinGame({
  gameId,
  userId,
}: {
  gameId: string;
  userId: string;
}) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { initialBalance: true },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  return prisma.gameParticipant.create({
    data: {
      gameId,
      userId,
      balance: game.initialBalance,
    },
  });
}

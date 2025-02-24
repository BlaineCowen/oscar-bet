-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "game_participants" ALTER COLUMN "balance" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "bankBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

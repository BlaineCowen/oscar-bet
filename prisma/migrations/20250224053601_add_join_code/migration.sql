/*
  Warnings:

  - You are about to drop the column `bankBalance` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `games` table. All the data in the column will be lost.
  - You are about to alter the column `initialBalance` on the `games` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "games" DROP COLUMN "bankBalance",
DROP COLUMN "isActive",
ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "joinCodeExpiresAt" TIMESTAMP(3),
ALTER COLUMN "initialBalance" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "games_adminId_idx" ON "games"("adminId");

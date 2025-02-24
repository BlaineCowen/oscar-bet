/*
  Warnings:

  - You are about to drop the column `isWon` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `Bet` table. All the data in the column will be lost.
  - You are about to drop the column `potentialWin` on the `Bet` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Bet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `isLocked` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `winner` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `initialBalance` on the `Game` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_participantId_fkey";

-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "isWon",
DROP COLUMN "participantId",
DROP COLUMN "potentialWin",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "gameId" TEXT NOT NULL,
ADD COLUMN     "gameParticipantId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isLocked",
DROP COLUMN "winner";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "initialBalance",
ADD COLUMN     "bankBalance" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Nominee" ADD COLUMN     "isWinner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameParticipantId_fkey" FOREIGN KEY ("gameParticipantId") REFERENCES "GameParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `winner` on the `categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bets" ADD COLUMN     "paidOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "winner",
ADD COLUMN     "winnerId" TEXT;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "nominees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

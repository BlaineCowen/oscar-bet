/*
  Warnings:

  - You are about to drop the column `categoryId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `bets` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `game_participants` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `bankBalance` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `isWinner` on the `nominees` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `gameParticipantId` on table `bets` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_gameId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_gameParticipantId_fkey";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "bets" DROP COLUMN "categoryId",
DROP COLUMN "gameId",
ALTER COLUMN "gameParticipantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "winner" TEXT;

-- AlterTable
ALTER TABLE "game_participants" ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "games" DROP COLUMN "bankBalance",
ADD COLUMN     "initialBalance" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "nominees" DROP COLUMN "isWinner";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "isAdmin",
DROP COLUMN "lastLogin",
DROP COLUMN "updatedAt",
DROP COLUMN "username",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_gameParticipantId_fkey" FOREIGN KEY ("gameParticipantId") REFERENCES "game_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

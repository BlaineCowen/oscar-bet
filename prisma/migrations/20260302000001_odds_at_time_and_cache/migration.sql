-- AlterTable: store odds at bet placement time
ALTER TABLE "bets" ADD COLUMN IF NOT EXISTS "oddsAtTime" DOUBLE PRECISION;

-- CreateTable: Kalshi category/odds cache
CREATE TABLE IF NOT EXISTS "kalshi_cache" (
  "id"        TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
  "data"      JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

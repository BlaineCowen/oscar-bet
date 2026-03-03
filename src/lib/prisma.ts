import { PrismaClient } from "@prisma/client";

// DATABASE_URL gets overridden to an Accelerate URL by an unknown source in the Next.js process.
// NEON_URL bypasses that by using a variable name that isn't touched.
const dbUrl =
  process.env.NEON_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.cachedPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: dbUrl } },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = prisma;
}

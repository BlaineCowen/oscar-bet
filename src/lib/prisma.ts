import { PrismaClient } from "@prisma/client";

// This is needed for Next.js Edge Runtime compatibility
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Enable connection pooling
    // The datasourceUrl will fall back to DATABASE_URL if not specified
    // If using Prisma Accelerate, it will use the PRISMA_ACCELERATE_URL env var
    datasourceUrl:
      process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL,
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton>;
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

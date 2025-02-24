import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// Note: This file is used in Node.js environments only
// It doesn't need runtime config as it's not a route handler or middleware

const prisma = new PrismaClient();

export const auth = betterAuth({
  appName: "Oscar Night",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  cookies: {
    sessionToken: {
      name: "session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  plugins: [nextCookies()],
});

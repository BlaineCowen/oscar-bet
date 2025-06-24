import "next-auth";
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT, DefaultJWT } from "next-auth/jwt";
import type { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    hashedPassword?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT types
   */
  interface JWT extends DefaultJWT {
    id: string;
  }
}

// Additional types for Prisma
declare module "@prisma/client" {
  interface User {
    hashedPassword?: string | null;
  }
}

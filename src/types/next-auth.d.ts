import "next-auth";
import { DefaultSession } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    hashedPassword?: string;
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

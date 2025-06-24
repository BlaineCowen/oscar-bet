import type { AuthConfig } from "@auth/core";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

/**
 * Base Auth.js config without database adapter
 * Used for Edge compatibility
 */
export const authConfig: AuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }) as any,
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    jwt({ token, user }: any) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};

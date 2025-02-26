import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import type { NextRequest } from "next/server";

/**
 * Base Auth.js config without database adapter
 * Used for Edge compatibility
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    authorized({ auth, request: req }: { auth: any; request: NextRequest }) {
      const isLoggedIn = !!auth?.user;
      const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute =
        ["/", "/login", "/register", "/about", "/contact"].includes(
          req.nextUrl.pathname
        ) || req.nextUrl.pathname.startsWith("/api/auth");

      if (isPublicRoute || isApiAuthRoute) {
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // This will be implemented in the main auth.ts file
        // This is just a placeholder since auth.config.ts needs it
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;

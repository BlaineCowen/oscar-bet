import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "@/lib/auth-utils";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";

interface CredentialsType {
  email: string;
  password: string;
}

const credentialsConfig = {
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(
    credentials: Partial<CredentialsType> | undefined
  ): Promise<User | null> {
    if (!credentials?.email || !credentials?.password) {
      throw new Error("CredentialsSignin");
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!dbUser?.hashedPassword) {
      throw new Error("CredentialsSignin");
    }

    const isValid = await compare(credentials.password, dbUser.hashedPassword);

    if (!isValid) {
      throw new Error("CredentialsSignin");
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || null,
      image: dbUser.image || null,
    };
  },
} as const;

const config = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [...authConfig.providers, CredentialsProvider(credentialsConfig)],
} as const;

export const { auth, handlers, signIn, signOut } = NextAuth(config as any);

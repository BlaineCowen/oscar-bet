import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";



// Force Node.js runtime for Prisma and better-auth
export const runtime = "nodejs";
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account first
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credentials",
          accountId: user.id,
          password: hashedPassword,
        },
      });

      return user;
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to register user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}

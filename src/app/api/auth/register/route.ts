import { hash } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { linkGuestParticipant, PT_COOKIE_OPTS } from "@/lib/link-guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await hash(password);
    const user = await prisma.user.create({
      data: { email, name, hashedPassword },
    });

    // Link any guest participant from the pt cookie to this new account
    const ptToken = req.cookies.get("pt")?.value;
    let linkedGameId: string | null = null;

    if (ptToken) {
      linkedGameId = await linkGuestParticipant(ptToken, user.id);
    }

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      linkedGameId,
    });

    // Clear the pt cookie if we successfully linked (token is now null in DB)
    if (linkedGameId) {
      res.cookies.set("pt", "", { ...PT_COOKIE_OPTS, maxAge: 0 });
    }

    return res;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

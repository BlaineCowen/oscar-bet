import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force Node.js runtime for blob operations
export const runtime = "nodejs";

// Force dynamic response
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  // Validate the user is authenticated (replace with your auth check)
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin of any game
  const isAdmin = await prisma.game.findFirst({
    where: { adminId: userId },
  });

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only game admins can upload images" },
      { status: 403 }
    );
  }

  if (!filename) {
    return NextResponse.json(
      { error: "Filename is required" },
      { status: 400 }
    );
  }

  try {
    // Get blob upload URL from Vercel Blob
    const blob = await put(filename, request.body!, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Error uploading to blob storage:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

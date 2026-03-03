import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-off debug: what DB URL is the server actually using?
 * DELETE this route after fixing the issue.
 */
export async function GET() {
  const url = process.env.DATABASE_URL ?? "(not set)";
  const direct = process.env.DIRECT_URL ?? "(not set)";
  const isAccelerate = typeof url === "string" && url.startsWith("prisma+postgres");
  const host = typeof url === "string" ? url.replace(/:[^:@]+@/, ":****@").slice(0, 80) : url;

  return NextResponse.json({
    DATABASE_URL_prefix: host,
    DIRECT_URL_prefix:
      typeof direct === "string" ? direct.replace(/:[^:@]+@/, ":****@").slice(0, 80) : direct,
    isAccelerate,
    note: isAccelerate
      ? "DATABASE_URL still points to Accelerate — fix .env or remove .env.local / shell export"
      : "DATABASE_URL looks direct. If you still see Accelerate errors, restart dev server and clear .next",
  });
}

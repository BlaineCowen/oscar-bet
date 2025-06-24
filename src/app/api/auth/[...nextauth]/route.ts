import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = auth;

export const GET = handler;
export const POST = handler;

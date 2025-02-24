import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);

// Configure the runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/auth";

// Export Auth.js API handlers for Next.js
export const { GET, POST } = handlers;

// Edge compatibility
export const runtime = "edge";

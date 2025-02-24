import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  authPath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});

// Export the methods we need
export const { signUp, signIn, signOut, useSession } = client;

// Export the full client as well
export const authClient = client;

// Listen for session changes
client.$store.listen("$sessionSignal", async () => {
  console.log("Session changed");
});

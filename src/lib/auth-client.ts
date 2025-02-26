import { useSession, signIn, signOut } from "next-auth/react";

// This is a client-side file, so runtime config isn't needed here
// But any server components or API routes that import this will need 'nodejs' runtime

// Export the methods we need
export { useSession, signIn, signOut };

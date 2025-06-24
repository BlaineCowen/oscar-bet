"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      Sign Out
    </button>
  );
}

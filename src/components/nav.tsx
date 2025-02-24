"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";

export function Nav() {
  const { data: session } = useAuth();

  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Oscar Bet
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/games" className="hover:text-gray-300">
                My Games
              </Link>
              <button
                onClick={() => authClient.signOut()}
                className="hover:text-gray-300"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gold text-black px-4 py-2 rounded hover:bg-gold/90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

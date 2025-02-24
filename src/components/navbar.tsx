"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-bold">Oscar Betting Game</span>
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/games"
                className="text-sm font-medium transition-colors hover:text-foreground/80"
              >
                My Games
              </Link>
              <Button
                variant="ghost"
                onClick={() => authClient.signOut()}
                className="text-sm font-medium"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

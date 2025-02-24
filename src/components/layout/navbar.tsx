"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "../sign-out-button";
import { Trophy } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-border/30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold" />
          <span className="text-xl font-bold bg-gradient-to-r from-gold to-oscar-red bg-clip-text text-transparent">
            Oscar Betting Pool
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/games"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                My Games
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {session.user.name}
                </span>
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hover:text-primary">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

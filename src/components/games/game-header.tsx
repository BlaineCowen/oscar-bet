"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface GameHeaderProps {
  name: string;
  isAdmin: boolean;
  gameId: string;
  locked: boolean;
}

export default function GameHeader({
  name,
  isAdmin,
  gameId,
  locked,
}: GameHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">{name}</h1>
        {locked && (
          <div className="flex items-center gap-2 text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
            <Lock className="h-4 w-4" />
            <span>Game Locked - No More Bets</span>
          </div>
        )}
      </div>
      {isAdmin && (
        <Link
          href={`/games/${gameId}/admin`}
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90"
        >
          Admin Panel
        </Link>
      )}
    </div>
  );
}

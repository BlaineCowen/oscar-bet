"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import BettingForm from "@/components/games/betting-form";
import GameView from "@/components/games/game-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { GameWithRelations } from "@/types/prisma";
import { Lock } from "lucide-react";

interface GameClientProps {
  game: GameWithRelations;
}

export function GameClient({ game }: GameClientProps) {
  const { data: session } = useAuth();
  const userId = session?.user?.id;
  const [activeTab, setActiveTab] = useState("betting");

  const participant = game.participants.find((p) => p.user.id === userId);
  const isAdmin = game.adminId === userId;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{game.name}</h1>
        {game.locked && (
          <div className="flex items-center gap-2 text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
            <Lock className="h-4 w-4" />
            <span>Game Locked - No More Bets</span>
          </div>
        )}
      </div>

      {participant && userId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="betting">Place Bets</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="betting">
            {game.locked && (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted mb-4 p-4 rounded-lg">
                <Lock className="h-4 w-4" />
                <p>Betting is closed. No more bets can be placed.</p>
              </div>
            )}
            <BettingForm
              categories={game.categories}
              participant={participant}
              gameId={game.id}
              userId={userId}
              disabled={game.locked}
            />
          </TabsContent>
          <TabsContent value="leaderboard">
            <GameView participants={game.participants} currentUserId={userId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

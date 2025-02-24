"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { GameWithRelations } from "@/types/prisma";
import BettingForm from "@/components/games/betting-form";
import GameView from "@/components/games/game-view";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const { data: session } = useAuth();
  const userId = session?.user?.id;
  const [activeTab, setActiveTab] = useState("betting");

  const { data: game, isLoading } = useQuery<GameWithRelations>({
    queryKey: ["games", gameId],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch game");
      }
      return response.json();
    },
    enabled: !!gameId,
  });

  const participant = game?.participants.find((p) => p.user.id === userId);
  const isAdmin = game?.adminId === userId;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{game.name}</h1>
        {isAdmin && (
          <Link
            href={`/games/${game.id}/admin`}
            className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90"
          >
            Admin Panel
          </Link>
        )}
      </div>

      {participant && userId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="betting">Place Bets</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="betting">
            <BettingForm
              categories={game.categories}
              participant={participant}
              gameId={game.id}
              userId={userId}
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

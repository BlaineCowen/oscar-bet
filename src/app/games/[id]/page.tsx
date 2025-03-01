"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminModal from "./admin/admin-modal";
import { useUserId, useUser } from "@/hooks/useAuth";
import InviteCodeCard from "@/components/games/invite-code-card";
import TabView from "@/components/games/tab-view";
import type { GameParticipant, Bet, Nominee, Category } from "@prisma/client";
import type { SessionUser } from "@/hooks/useAuth";

type PageProps = {
  params: { id: string };
};

export default function GamePage({ params }: PageProps) {
  const gameId = params.id;

  // Use custom hook to get user ID
  const { data: user } = useUser();
  const userId = user?.id;

  const {
    data: game,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["games", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) throw new Error("Failed to fetch game");
      const data = await res.json();
      console.log("Game data fetched:", data);
      return data;
    },
    staleTime: 1000, // Consider data stale after 1 second
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (isLoading || !userId) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container py-6">
        <div className="text-center py-10">
          <h2 className="text-xl">Game not found</h2>
        </div>
      </div>
    );
  }

  const isAdmin = game.adminId === userId;
  const currentParticipant = game.participants?.find(
    (
      p: GameParticipant & {
        user: SessionUser;
        bets: (Bet & {
          nominee: Nominee & {
            category: Category;
          };
        })[];
      }
    ) => p.user.id === userId
  );

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Oscar Predictions</h1>
        {isAdmin && (
          <AdminModal
            gameId={game.id}
            categories={game.categories || []}
            isLocked={game.locked || false}
            participants={game.participants || []}
          />
        )}
      </div>

      {/* Invite Code Card - Only shown to admins */}
      <InviteCodeCard
        gameId={game.id}
        isAdmin={isAdmin}
        currentCode={game.joinCode}
      />

      {/* Replace GameView with TabView */}
      <TabView
        participants={game.participants || []}
        categories={game.categories || []}
        currentUserId={userId}
        gameId={game.id}
        locked={game.locked || false}
        currentParticipant={currentParticipant}
      />
    </div>
  );
}

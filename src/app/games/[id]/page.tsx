"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminModal from "./admin/admin-modal";
import { useUser } from "@/hooks/useAuth";
import InviteCodeCard from "@/components/games/invite-code-card";
import TabView from "@/components/games/tab-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function GamePage({ params }: PageProps) {
  const { id: gameId } = use(params);
  const { data: authUser } = useUser();

  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["games", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) throw new Error("Failed to fetch game");
      return res.json();
    },
    staleTime: 1000,
    refetchInterval: 5000,
  });

  // Identify the current participant via cookie (guests) or auth session (admin)
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["me", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/me?gameId=${gameId}`);
      if (!res.ok) return { participant: null };
      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const currentParticipant = meData?.participant ?? null;

  const isLoading = gameLoading || meLoading;

  if (isLoading) {
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
                  <Skeleton className="h-6 w-40" />
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

  const isAdmin = authUser && game.adminId === authUser.id;

  // Normalize participant name: guests use name field, auth users use user.name
  const normalizedParticipants = (game.participants ?? []).map((p: any) => ({
    ...p,
    user: {
      id: p.user?.id ?? p.id,
      name: p.name ?? p.user?.name ?? "Anonymous",
      email: p.user?.email ?? null,
      image: p.user?.image ?? null,
    },
  }));

  const normalizedCurrentParticipant = currentParticipant
    ? {
        ...currentParticipant,
        user: {
          id: currentParticipant.user?.id ?? currentParticipant.id,
          name:
            currentParticipant.name ??
            currentParticipant.user?.name ??
            "Anonymous",
          email: currentParticipant.user?.email ?? null,
        },
      }
    : null;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Oscar Predictions</h1>
        {isAdmin && (
          <AdminModal
            gameId={game.id}
            categories={game.categories || []}
            isLocked={game.locked || false}
            participants={normalizedParticipants}
          />
        )}
      </div>

      {!game.locked && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span>
            <strong>Odds are live</strong> — they update from Kalshi markets
            every hour. Your bet locks in the odds shown at the moment you place
            it. The admin will freeze odds just before the show starts.
          </span>
        </div>
      )}

      {isAdmin && (
        <InviteCodeCard
          gameId={game.id}
          isAdmin={!!isAdmin}
          currentCode={game.joinCode}
        />
      )}

      {!currentParticipant && !isAdmin && (
        <div className="mb-6 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground mb-2">
            You haven&apos;t joined this game yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Ask the admin for an invite link to join.
          </p>
        </div>
      )}

      <TabView
        participants={normalizedParticipants}
        categories={game.categories || []}
        currentUserId={
          currentParticipant?.user?.id ?? currentParticipant?.id ?? ""
        }
        gameId={game.id}
        locked={game.locked || false}
        currentParticipant={normalizedCurrentParticipant}
      />
    </div>
  );
}

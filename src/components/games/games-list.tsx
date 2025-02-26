"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { Game, GameParticipant } from "@prisma/client";
import type { SessionUser } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type GameWithParticipants = Game & {
  participants: (GameParticipant & {
    user: SessionUser;
  })[];
};

export function GamesList() {
  const { data: session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const { data: games, isLoading } = useQuery<GameWithParticipants[]>({
    queryKey: ["games", userId],
    queryFn: async () => {
      console.log("Fetching games for user:", userId);
      const response = await fetch("/api/games", {
        headers: {
          "x-user-id": userId!,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }
      const data = await response.json();
      console.log("Fetched games:", data);
      return data;
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const deleteGame = useMutation({
    mutationFn: async (gameId: string) => {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete game");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", userId] });
      toast.success("Game deleted successfully");
    },
    onError: (error) => {
      toast.error(
        `Error: ${
          error instanceof Error ? error.message : "Failed to delete game"
        }`
      );
    },
  });

  const handleDelete = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault(); // Prevent navigation to game page
    e.stopPropagation(); // Prevent event bubbling

    if (
      confirm(
        "Are you sure you want to delete this game? This action cannot be undone."
      )
    ) {
      deleteGame.mutate(gameId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow hover:shadow-md transition-shadow">
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!games?.length) {
    return (
      <Card className="border-dashed border-2 p-4">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No games yet. Create one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {games.map((game) => (
        <Card
          key={game.id}
          className="shadow hover:shadow-md transition-shadow"
        >
          <Link href={`/games/${game.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{game.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4">
                      {game.locked ? (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-500">
                          <Unlock className="h-3 w-3" /> Open for betting
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {game.participants.length} participant
                        {game.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Start: {new Date(game.startDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  End: {new Date(game.endDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Initial Balance: ${game.initialBalance}
                </span>
              </div>
            </CardContent>
          </Link>
          {game.adminId === userId && (
            <CardFooter className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => handleDelete(e, game.id)}
                className="opacity-80 hover:opacity-100"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}

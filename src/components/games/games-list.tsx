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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type GameWithParticipants = Game & {
  participants: (GameParticipant & {
    user: SessionUser;
  })[];
};

export function GamesList() {
  const { data: session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [gameBeingDeleted, setGameBeingDeleted] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      setGameBeingDeleted(gameId);
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
      setGameBeingDeleted(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      setGameBeingDeleted(null);
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
    setGameBeingDeleted(gameId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (gameId: string) => {
    deleteGame.mutate(gameId);
  };

  const handleCancelDelete = () => {
    setGameBeingDeleted(null);
    setIsDeleteDialogOpen(false);
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

  const userGames = games.filter((game) => game.adminId === userId);
  const isAtLimit = userGames.length >= 10;
  const isNearLimit = userGames.length >= 8;

  return (
    <div className="grid gap-6">
      {isAtLimit && (
        <Alert variant="destructive">
          <AlertTitle>Game Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the maximum limit of 10 games. Please delete some
            games to create new ones.
          </AlertDescription>
        </Alert>
      )}
      {!isAtLimit && isNearLimit && (
        <Alert>
          <AlertTitle>Almost at Game Limit</AlertTitle>
          <AlertDescription>
            You can create {10 - userGames.length} more{" "}
            {10 - userGames.length === 1 ? "game" : "games"} before reaching the
            limit of 10 games.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this game? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                gameBeingDeleted && handleConfirmDelete(gameBeingDeleted)
              }
              disabled={deleteGame.isPending}
            >
              {deleteGame.isPending ? (
                <span className="flex items-center gap-2">
                  Deleting
                  <Spinner show={true} size="small" />
                </span>
              ) : (
                "Delete Game"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {games?.map((game) => (
        <Card
          key={game.id}
          className={cn(
            "shadow hover:shadow-md transition-shadow",
            gameBeingDeleted === game.id && "opacity-50 pointer-events-none"
          )}
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
                disabled={gameBeingDeleted === game.id}
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

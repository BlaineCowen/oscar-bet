"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Game, GameParticipant } from "@prisma/client";
import type { SessionUser } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type GameWithParticipants = Game & {
  participants: (GameParticipant & {
    user: SessionUser;
  })[];
};

const bounceKeyframes = {
  "0%, 100%": {
    transform: "translateY(-10%)",
    animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
  },
  "50%": {
    transform: "translateY(0%)",
    animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
  },
};

export function CreateGameButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameName, setGameName] = useState("Oscars 2024");
  const [initialBalance, setInitialBalance] = useState("1000");
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  const isLoading = isPending || isSubmitting;

  const { data: games } = useQuery<GameWithParticipants[]>({
    queryKey: ["games", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch("/api/games", {
        headers: {
          "x-user-id": userId,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  const userGames = games?.filter((game) => game.adminId === userId) ?? [];
  const isAtLimit = userGames.length >= 10;

  const createGame = async () => {
    if (!userId) return;
    if (isAtLimit) {
      toast.error("You have reached the maximum limit of 10 games");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name: gameName,
          startDate: new Date().toISOString(),
          endDate: new Date(2024, 2, 10).toISOString(), // March 10, 2024
          initialBalance: Number(initialBalance),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const game = await response.json();

      startTransition(() => {
        setIsOpen(false);
        router.push(`/games/${game.id}`);
        router.refresh();
      });
    } catch (error) {
      console.error("Error creating game:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoading && setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <button
          disabled={!userId || isAtLimit}
          className="bg-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-gold/90 transition-colors disabled:opacity-50 relative group"
          aria-label="Create Game"
        >
          Create Game
          {isAtLimit && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover rounded-md text-sm text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              You have reached the maximum limit of 10 games. Please delete some
              games to create new ones.
            </div>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Game Name</Label>
            <Input
              id="name"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Initial Balance</Label>
            <Input
              id="balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="Enter initial balance"
              disabled={isLoading}
              min="50"
            />
          </div>
          <button
            onClick={createGame}
            disabled={
              isLoading ||
              !gameName.trim() ||
              !initialBalance ||
              Number(initialBalance) < 50 ||
              isAtLimit
            }
            className={`w-full bg-gold text-black px-6 flex items-center justify-center py-3 rounded-lg font-bold hover:bg-gold/90 transition-colors disabled:opacity-50
            ${isLoading ? "animate-pulse" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                Creating
                <div className="flex">
                  <span
                    style={{ animation: "smallBounce 1s ease-in-out infinite" }}
                  >
                    .
                  </span>
                  <span
                    style={{
                      animation: "smallBounce 1s ease-in-out infinite 0.2s",
                    }}
                  >
                    .
                  </span>
                  <span
                    style={{
                      animation: "smallBounce 1s ease-in-out infinite 0.4s",
                    }}
                  >
                    .
                  </span>
                </div>
              </div>
            ) : (
              "Create Game"
            )}
          </button>
        </div>
      </DialogContent>
      <style jsx>{`
        @keyframes smallBounce {
          0%,
          100% {
            transform: translateY(-10%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0%);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </Dialog>
  );
}

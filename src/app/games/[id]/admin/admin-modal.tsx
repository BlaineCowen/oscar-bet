"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Unlock, AlertCircle } from "lucide-react";
import type { Category, Nominee } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

type CategoryWithNominees = Category & {
  nominees: Nominee[];
  winner?: Nominee;
};

interface AdminModalProps {
  gameId: string;
  categories: CategoryWithNominees[];
  isLocked?: boolean;
  participants: Array<{
    id: string;
    user: { name: string | null };
    bets: any[];
  }>;
}

export default function AdminModal({
  gameId,
  categories,
  isLocked = false,
  participants,
}: AdminModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingGameLock, setIsConfirmingGameLock] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const categoryOrder = [
    "Best Picture",
    "Best Director",
    "Best Actress",
    "Best Actor",
    "Best Supporting Actress",
    "Best Supporting Actor",
    "Best Adapted Screenplay",
    "Best Original Screenplay",
    "Best Cinematography",
    "Best Costume Design",
    "Best Film Editing",
    "Best Makeup and Hairstyling",
    "Best Production Design",
    "Best Score",
    "Best Song",
    "Best Sound",
    "Best Visual Effects",
    "Best Animated Feature",
    "Best Documentary Feature",
    "Best International Film",
    "Best Animated Short",
    "Best Documentary Short",
    "Best Live Action Short",
  ];

  // Sort categories based on categoryOrder
  const sortedCategories = [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.name);
    const bIndex = categoryOrder.indexOf(b.name);
    return aIndex - bIndex;
  });

  const updateWinner = useMutation({
    mutationFn: async (data: { categoryId: string; nomineeId: string }) => {
      console.log("Setting winner:", data);
      const res = await fetch(
        `/api/games/${gameId}/categories/${data.categoryId}/winner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nomineeId: data.nomineeId }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to set winner");
      }

      const responseData = await res.json();
      console.log("Set winner response:", responseData);
      return responseData;
    },
    onMutate: async (data) => {
      console.log("Starting optimistic update for winner:", data);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["games", gameId] });
      console.log("Canceled outgoing queries");

      // Snapshot the previous game data
      const previousGame = queryClient.getQueryData(["games", gameId]);
      console.log("Saved previous game state:", previousGame);

      // Optimistically update the game data to show the winner
      if (previousGame) {
        console.log("Attempting optimistic update for category winner");
        queryClient.setQueryData(["games", gameId], (oldData: any) => {
          if (!oldData) return previousGame;

          // Deep clone to avoid mutation issues
          const newData = JSON.parse(JSON.stringify(oldData));

          // Find the category and update its winner
          if (newData.categories) {
            const category = newData.categories.find(
              (c: any) => c.id === data.categoryId
            );
            if (category) {
              category.winnerId = data.nomineeId;
              console.log(
                "Category winner updated in optimistic data:",
                category
              );
            }
          }

          return newData;
        });
      }

      // Return context with the snapshotted value
      return { previousGame };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      console.error("Error setting winner:", err);
      if (context?.previousGame) {
        console.log("Rolling back to previous state", context.previousGame);
        queryClient.setQueryData(["games", gameId], context.previousGame);
      }
    },
    onSuccess: (data) => {
      console.log("Winner set successfully, updating UI with data:", data);

      // Close the modal and reset states immediately
      setIsConfirming(false);
      setSelectedCategory("");
      setSelectedWinner("");
      setIsOpen(false);

      // Update the cache with the returned data
      queryClient.setQueryData(["games", gameId], data);
      console.log("Cache updated with server data");

      // Force a full refetch to ensure we have fresh data
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["games"] }),
        queryClient.invalidateQueries({ queryKey: ["games", gameId] }),
        queryClient.refetchQueries({ queryKey: ["games", gameId] }),
      ]).then(() => {
        console.log("All game queries refreshed");
      });
    },
    // Add mutation scope for winner updates
    scope: {
      id: `winner-${gameId}`,
    },
  });

  const lockGame = useMutation({
    mutationFn: async () => {
      console.log("Locking game:", gameId);
      const res = await fetch(`/api/games/${gameId}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to lock game");
      }

      const data = await res.json();
      console.log("Lock game response:", data);
      return data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["games", gameId] });
      console.log("Canceled outgoing queries");

      // Snapshot the previous value
      const previousGame = queryClient.getQueryData(["games", gameId]);
      console.log("Saved previous game state:", previousGame);

      // Optimistically update to the new value
      queryClient.setQueryData(["games", gameId], (oldData: any) => {
        console.log("Optimistically updating game, old data:", oldData);
        if (!oldData) return { locked: true };

        const newData = {
          ...oldData,
          locked: true,
        };
        console.log("New optimistic data:", newData);
        return newData;
      });

      return { previousGame };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      console.error("Error locking game:", err);
      if (context?.previousGame) {
        console.log("Rolling back to previous state", context.previousGame);
        queryClient.setQueryData(["games", gameId], context.previousGame);
      }
    },
    onSuccess: (data) => {
      console.log("Game locked successfully, updating UI with data:", data);

      // Close the modal and reset states immediately
      setIsConfirmingGameLock(false);
      setIsOpen(false);

      // Update the cache with the returned data
      queryClient.setQueryData(["games", gameId], data);
      console.log("Cache updated with server data");

      // Force a full refetch to ensure we have fresh data
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["games"] }),
        queryClient.invalidateQueries({ queryKey: ["games", gameId] }),
        queryClient.refetchQueries({ queryKey: ["games", gameId] }),
      ]).then(() => {
        console.log("All game queries refreshed");
      });
    },
    // Add mutation scope for game locking
    scope: {
      id: `lock-${gameId}`,
    },
  });

  const handleSetWinner = () => {
    if (!selectedCategory || !selectedWinner) return;

    const category = categories.find((c) => c.name === selectedCategory);
    if (!category) return;

    const nominee = category.nominees.find((n) => n.id === selectedWinner);
    if (!nominee) return;

    updateWinner.mutate({
      categoryId: category.id,
      nomineeId: nominee.id,
    });
  };

  const handleLockGame = () => {
    // Check for users without bets
    const usersWithoutBets = participants.filter((p) => p.bets.length === 0);

    if (usersWithoutBets.length > 0) {
      setIsConfirmingGameLock(true);
      return;
    }

    lockGame.mutate();
  };

  const currentCategory = categories.find((c) => c.name === selectedCategory);

  // Get users without bets for the confirmation message
  const usersWithoutBets = participants.filter((p) => p.bets.length === 0);
  const hasUnlockedUsers = usersWithoutBets.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Admin Controls</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] p-6">
        <DialogHeader>
          <DialogTitle>Admin Controls</DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Game is locked. Select winners for each category."
              : "Lock the game and select winners for each category."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-8rem)]" ref={scrollAreaRef}>
          <div className="space-y-6 pr-4">
            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Game Status</h3>
              {isLocked ? (
                <div className="flex items-center gap-2 text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
                  <Lock className="h-4 w-4" />
                  <span>Game Locked</span>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsConfirmingGameLock(true)}
                  disabled={lockGame.isPending}
                >
                  {lockGame.isPending ? "Processing..." : "Lock Game"}
                </Button>
              )}
            </div>

            {isConfirmingGameLock && (
              <Alert variant="destructive">
                <AlertTitle>Are you sure you want to lock the game?</AlertTitle>
                <AlertDescription>
                  <p className="mb-4">
                    This will prevent all players from updating their bets. This
                    action cannot be undone.
                  </p>
                  {hasUnlockedUsers && (
                    <div className="mb-4 p-3 bg-destructive/20 rounded-md">
                      <p className="font-medium mb-2">
                        The following users have not submitted bets:
                      </p>
                      <ul className="list-disc list-inside">
                        {usersWithoutBets.map((p) => (
                          <li key={p.id}>{p.user.name || "Unnamed User"}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">
                        These users will be removed from the leaderboard.
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    {hasUnlockedUsers ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirmingGameLock(false)}
                          disabled={lockGame.isPending}
                        >
                          Wait for all users
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => lockGame.mutate()}
                          disabled={lockGame.isPending}
                        >
                          {lockGame.isPending ? (
                            <span className="flex items-center gap-2">
                              Processing
                              <Spinner show={true} size="small" />
                            </span>
                          ) : (
                            "Lock Game Anyway"
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => lockGame.mutate()}
                          disabled={lockGame.isPending}
                        >
                          {lockGame.isPending ? (
                            <span className="flex items-center gap-2">
                              Processing
                              <Spinner show={true} size="small" />
                            </span>
                          ) : (
                            "Lock Game"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirmingGameLock(false)}
                          disabled={lockGame.isPending}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Category Selection */}
            {!isLocked ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Lock the game first to start selecting winners
              </div>
            ) : (
              <>
                <div className="space-y-2 p-2">
                  <Label>Select Winners</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories
                        .filter((category) => !category.winnerId)
                        .map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Winner Selection */}
                {selectedCategory && currentCategory && (
                  <div className="space-y-2">
                    <Label>Select Winner</Label>
                    <RadioGroup
                      value={selectedWinner}
                      onValueChange={setSelectedWinner}
                    >
                      <div className="space-y-2">
                        {currentCategory.nominees.map((nominee) => (
                          <div
                            key={nominee.id}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={nominee.id}
                              id={nominee.id}
                            />
                            <Label htmlFor={nominee.id}>
                              {currentCategory.name === "Best Song" ? (
                                <>
                                  {nominee.name}{" "}
                                  <span className="text-muted-foreground">
                                    ({nominee.movie})
                                  </span>
                                </>
                              ) : (
                                `${nominee.name} (${nominee.odds}x)`
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Confirmation */}
                {selectedCategory && selectedWinner && !isConfirming && (
                  <Button
                    onClick={() => setIsConfirming(true)}
                    className="w-full"
                    disabled={updateWinner.isPending}
                  >
                    {updateWinner.isPending ? (
                      <span className="flex items-center gap-2">
                        Processing
                        <Spinner show={true} size="small" />
                      </span>
                    ) : (
                      "Set Winner"
                    )}
                  </Button>
                )}

                {isConfirming && (
                  <Alert>
                    <AlertTitle>Are you sure?</AlertTitle>
                    <AlertDescription>
                      <p className="mb-4">
                        This will set{" "}
                        {
                          currentCategory?.nominees.find(
                            (n) => n.id === selectedWinner
                          )?.name
                        }{" "}
                        as the winner of {selectedCategory}. Winning bets will
                        be paid out at the specified odds. This action cannot be
                        undone.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          onClick={handleSetWinner}
                          disabled={
                            updateWinner.isPending ||
                            !selectedCategory ||
                            !selectedWinner
                          }
                        >
                          {updateWinner.isPending ? (
                            <span className="flex items-center gap-2">
                              Processing
                              <Spinner show={true} size="small" />
                            </span>
                          ) : (
                            "Confirm Winner"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirming(false)}
                          disabled={updateWinner.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Category Status Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Odds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map((category) => {
                  const winner = category.nominees.find(
                    (n) => n.id === category.winnerId
                  );
                  return (
                    <TableRow key={category.name}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        {category.winnerId ? (
                          <div className="flex items-center gap-2 text-green-500">
                            <Lock className="h-4 w-4" />
                            <span>Winner Selected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4" />
                            <span className="text-muted-foreground">
                              Pending Winner
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          category.winnerId ? "text-green-500 font-medium" : ""
                        }
                      >
                        {winner?.name || "-"}
                      </TableCell>
                      <TableCell>{winner ? `${winner.odds}x` : "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

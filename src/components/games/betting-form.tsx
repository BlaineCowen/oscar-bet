"use client";

import { useState } from "react";
import type { Category, Nominee, GameParticipant, Bet } from "@prisma/client";
import { AlertCircle, Film } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NomineeCard } from "@/components/nominees/nominee-card";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type CategoryWithNominees = Category & {
  nominees: Nominee[];
};

type BetWithRelations = Bet & {
  nominee: Nominee & {
    category: Category;
  };
};

interface BettingFormProps {
  categories: CategoryWithNominees[];
  participant: GameParticipant & {
    bets: BetWithRelations[];
  };
  gameId: string;
  userId: string;
  disabled?: boolean;
}

export default function BettingForm({
  categories,
  participant,
  gameId,
  userId,
  disabled = false,
}: BettingFormProps) {
  const [selectedNominees, setSelectedNominees] = useState<
    Record<string, string>
  >(() => {
    // If there are existing bets, use those instead of localStorage
    if (participant.bets.length > 0) {
      return participant.bets.reduce((acc, bet) => {
        if (bet.nominee?.category) {
          acc[bet.nominee.category.id] = bet.nomineeId;
        }
        return acc;
      }, {} as Record<string, string>);
    }

    const saved = localStorage.getItem(`bets-${gameId}-nominees`);
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [betAmounts, setBetAmounts] = useState<Record<string, number>>(() => {
    // If there are existing bets, use those instead of localStorage
    if (participant.bets.length > 0) {
      return participant.bets.reduce((acc, bet) => {
        if (bet.nominee?.category) {
          acc[bet.nominee.category.id] = bet.amount;
        }
        return acc;
      }, {} as Record<string, number>);
    }

    const saved = localStorage.getItem(`bets-${gameId}-amounts`);
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasExistingBets = participant.bets.length > 0;

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

  // Initial balance is fixed - it's the participant's balance plus their existing bets
  const initialBalance =
    participant.balance +
    participant.bets.reduce((sum, bet) => sum + bet.amount, 0);

  // Calculate current balance based on all input fields
  const calculateCurrentBalance = () => {
    const totalBets = Object.values(betAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    );
    return initialBalance - totalBets;
  };

  const currentBalance = calculateCurrentBalance();

  // Calculate max amount for a specific category input
  const getMaxAmountForCategory = (categoryId: string) => {
    // Current balance + the amount already allocated to this category
    return currentBalance + (betAmounts[categoryId] || 0);
  };

  const handleNomineeSelect = (categoryId: string, nomineeId: string) => {
    console.log(`Selecting nominee: ${nomineeId} for category: ${categoryId}`);
    const newNominees = {
      ...selectedNominees,
      [categoryId]: nomineeId,
    };
    setSelectedNominees(newNominees);
    localStorage.setItem(
      `bets-${gameId}-nominees`,
      JSON.stringify(newNominees)
    );

    // If no amount set for this category yet, set a default amount of 1
    if (!betAmounts[categoryId] && currentBalance > 0) {
      handleAmountChange(categoryId, "1");
    }
  };

  const handleAmountChange = (categoryId: string, amount: string) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) return;

    setBetAmounts((prev) => {
      const newAmounts = {
        ...prev,
        [categoryId]: numAmount,
      };

      localStorage.setItem(
        `bets-${gameId}-amounts`,
        JSON.stringify(newAmounts)
      );

      return newAmounts;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const submitBets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    // Check if balance is negative
    if (currentBalance < 0) {
      toast.error("Total bet amount exceeds your balance");
      return;
    }

    // Check if all categories have nominees selected
    const missingCategories = categories.filter(
      (cat) => !selectedNominees[cat.id]
    );
    if (missingCategories.length > 0) {
      const errorMsg = `Please select nominees for all categories. Missing: ${missingCategories
        .map((c) => c.name)
        .join(", ")}`;
      toast.error(errorMsg);
      return;
    }

    // Check if all selected nominees have bet amounts
    const missingAmounts = Object.entries(selectedNominees).filter(
      ([categoryId]) => !betAmounts[categoryId] || betAmounts[categoryId] <= 0
    );
    if (missingAmounts.length > 0) {
      const missingCategories = missingAmounts
        .map(
          ([categoryId]) => categories.find((c) => c.id === categoryId)?.name
        )
        .filter(Boolean);
      const errorMsg = `Please enter bet amounts for all selections. Missing: ${missingCategories.join(
        ", "
      )}`;
      toast.error(errorMsg);
      return;
    }

    try {
      setIsSubmitting(true);

      const bets = Object.entries(selectedNominees).map(
        ([categoryId, nomineeId]) => ({
          nomineeId,
          categoryId,
          amount: betAmounts[categoryId],
        })
      );

      console.log(bets);

      const response = await fetch(
        `/api/games/${gameId}/bets${hasExistingBets ? "/update" : ""}`,
        {
          method: hasExistingBets ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ bets }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Failed to ${hasExistingBets ? "update" : "place"} bets`
        );
      }

      const result = await response.json();

      // Create a fresh state after submission
      if (result.bets) {
        // Update participant object with new bets from server response
        participant.bets = result.bets.map((bet: any) => ({
          ...bet,
          nominee: {
            ...bet.nominee,
            category:
              categories.find((c) => c.id === bet.nominee.categoryId) ||
              bet.nominee.category,
          },
        }));

        // Reset local state to match the new bets
        const newNominees: Record<string, string> = {};
        const newAmounts: Record<string, number> = {};

        result.bets.forEach((bet: any) => {
          const category = categories.find(
            (c) => c.id === bet.nominee.categoryId
          );
          if (category) {
            newNominees[category.id] = bet.nomineeId;
            newAmounts[category.id] = bet.amount;
          }
        });

        // Re-initialize state with fresh data
        setSelectedNominees(newNominees);
        setBetAmounts(newAmounts);

        // Update localStorage
        localStorage.setItem(
          `bets-${gameId}-nominees`,
          JSON.stringify(newNominees)
        );
        localStorage.setItem(
          `bets-${gameId}-amounts`,
          JSON.stringify(newAmounts)
        );
      }

      // Update participant balance - use what the server returned if available
      if (
        result.participant &&
        typeof result.participant.balance === "number"
      ) {
        participant.balance = result.participant.balance;
      } else {
        participant.balance =
          initialBalance -
          Object.values(betAmounts).reduce((sum, amount) => sum + amount, 0);
      }

      const successMessageText = hasExistingBets
        ? `Bets successfully updated! Your new balance is $${participant.balance.toFixed(
            2
          )}.`
        : `Bets successfully placed! Your balance is now $${participant.balance.toFixed(
            2
          )}.`;

      setSuccessMessage(successMessageText);

      // Add support message toast with link
      toast.success(
        <div className="flex items-center gap-2">
          Thanks for playing! Your support helps keep this site ad-free.{" "}
          <a
            href="https://buymeacoffee.com/blainecowen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 font-medium"
          >
            Buy me a coffee! ☕
          </a>
        </div>,
        {
          duration: 5000,
          position: "top-center",
        }
      );

      // Force refresh of component's current balance calculation
      setTimeout(() => {
        const forceUpdate = calculateCurrentBalance();
      }, 0);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error(
        `Error ${hasExistingBets ? "updating" : "placing"} bets:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${hasExistingBets ? "update" : "place"} bets`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const makeRandomBets = () => {
    const newNominees: Record<string, string> = {};
    const newAmounts: Record<string, number> = {};

    // Use the entire initial balance
    let remainingBalance = initialBalance;

    // First, make random selections for each category
    categories.forEach((category) => {
      const randomIndex = Math.floor(Math.random() * category.nominees.length);
      const nominee = category.nominees[randomIndex];
      newNominees[category.id] = nominee.id;
    });

    // Then distribute balance across categories
    const categoryCount = categories.length;
    categories.forEach((category, index) => {
      if (index === categories.length - 1) {
        // Last category gets remaining balance
        newAmounts[category.id] = remainingBalance;
      } else {
        // Calculate a reasonable random amount
        // For non-final categories, allocate between 5-25% of remaining
        const minPercent = 0.05;
        const maxPercent = 0.25;
        const percent = minPercent + Math.random() * (maxPercent - minPercent);
        const amount = Math.floor(remainingBalance * percent);

        // Ensure we don't go below 1
        newAmounts[category.id] = Math.max(1, amount);
        remainingBalance -= newAmounts[category.id];
      }
    });

    // Update state and localStorage
    setSelectedNominees(newNominees);
    setBetAmounts(newAmounts);

    localStorage.setItem(
      `bets-${gameId}-nominees`,
      JSON.stringify(newNominees)
    );
    localStorage.setItem(`bets-${gameId}-amounts`, JSON.stringify(newAmounts));
  };

  const distributeRemainingBalance = () => {
    // Count categories with selections but no money or with some money
    const activeCategories = Object.entries(selectedNominees)
      .filter(
        ([categoryId]) => !categories.find((c) => c.id === categoryId)?.winnerId
      )
      .map(([categoryId]) => categoryId);

    if (activeCategories.length === 0) return;

    // Calculate how much we need to distribute
    const equalShare = Math.floor(currentBalance / activeCategories.length);

    if (equalShare <= 0) return;

    // Distribute it evenly, with any remainder going to the first category
    let remaining = currentBalance;

    setBetAmounts((prev) => {
      const newAmounts = { ...prev };

      activeCategories.forEach((categoryId, index) => {
        // Last category gets remaining balance
        if (index === activeCategories.length - 1) {
          newAmounts[categoryId] = (newAmounts[categoryId] || 0) + remaining;
        } else {
          newAmounts[categoryId] = (newAmounts[categoryId] || 0) + equalShare;
          remaining -= equalShare;
        }
      });

      localStorage.setItem(
        `bets-${gameId}-amounts`,
        JSON.stringify(newAmounts)
      );

      return newAmounts;
    });
  };

  const clearAll = () => {
    setSelectedNominees({});
    setBetAmounts({});
    localStorage.removeItem(`bets-${gameId}-nominees`);
    localStorage.removeItem(`bets-${gameId}-amounts`);
  };

  return (
    <form onSubmit={submitBets} className="relative">
      <div className="container px-4 max-w-7xl mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-2xl font-bold">Place Your Bets</h2>
            {hasExistingBets && !disabled && (
              <span className="text-muted-foreground text-xs sm:text-sm">
                (You can update your bets until the game is locked)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container px-4 max-w-7xl mx-auto py-2">
          <div className="text-base sm:text-xl w-full sm:w-auto flex justify-end">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="whitespace-nowrap">
                  Available: ${currentBalance.toFixed(2)}
                </span>
                {currentBalance <= 0 ? (
                  <span className="text-green-500 text-xs sm:text-sm font-medium whitespace-nowrap">
                    All funds allocated
                  </span>
                ) : currentBalance < initialBalance * 0.1 ? (
                  <span className="text-yellow-500 text-xs sm:text-sm font-medium whitespace-nowrap">
                    Low funds
                  </span>
                ) : null}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground text-right">
                Initial Balance: ${initialBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-7xl mx-auto mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            className="text-sm sm:col-span-3"
            onClick={makeRandomBets}
            disabled={disabled}
          >
            Bet for me
          </Button>

          {currentBalance > 0 && !disabled && (
            <Button
              type="button"
              variant="outline"
              className="text-sm sm:col-span-6"
              onClick={distributeRemainingBalance}
            >
              Distribute Remaining ${currentBalance.toFixed(2)}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="text-sm text-destructive hover:text-destructive sm:col-span-3"
            onClick={clearAll}
            disabled={disabled}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="container px-4 max-w-7xl mx-auto space-y-6">
        {successMessage && (
          <Alert className="bg-green-500/10 border-green-500 text-green-500">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => {
            const existingBet = participant.bets.find(
              (bet) => bet.nominee?.category.id === category.id
            );
            const categoryWinner = category.winnerId
              ? category.nominees.find((n) => n.id === category.winnerId)?.name
              : null;
            // Only lock if the entire game is disabled
            const isLocked = disabled;
            // Visual indicator only - doesn't affect functionality
            const isCategoryLocked =
              category.isLocked || category.winnerId !== null;

            return (
              <Card
                key={category.id}
                className={`bg-card ${isLocked ? "opacity-50" : ""}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {(isLocked || isCategoryLocked) && (
                      <span className="text-sm text-muted-foreground">
                        Locked
                      </span>
                    )}
                  </div>
                  {existingBet && !isLocked && (
                    <p className="text-sm text-muted-foreground">
                      Current bet: ${existingBet.amount} on{" "}
                      {existingBet.nominee.name}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    onValueChange={(value) => {
                      console.log(
                        `RadioGroup change: ${value} for ${category.name}`
                      );
                      handleNomineeSelect(category.id, value);
                    }}
                    value={selectedNominees[category.id]}
                    disabled={isLocked}
                    name={`nominee-${category.id}`}
                  >
                    {category.nominees.map((nominee, index) => (
                      <div key={nominee.id} className="mb-3">
                        <RadioGroupItem
                          id={nominee.id}
                          value={nominee.id}
                          className="peer sr-only"
                          disabled={isLocked}
                        />
                        <Label htmlFor={nominee.id} className="sr-only">
                          {nominee.name}
                        </Label>
                        <NomineeCard
                          nominee={nominee}
                          isSelected={
                            selectedNominees[category.id] === nominee.id
                          }
                          disabled={isLocked}
                          showOdds={true}
                          categoryName={category.name}
                          onClick={() => {
                            // Only proceed if not disabled
                            if (isLocked) return;

                            // Directly call the select function instead of manipulating the DOM
                            handleNomineeSelect(category.id, nominee.id);

                            // Also update the DOM element to keep UI in sync
                            const selectedInput = document.getElementById(
                              nominee.id
                            ) as HTMLInputElement;
                            if (selectedInput) {
                              selectedInput.checked = true;
                            }
                          }}
                        />
                      </div>
                    ))}
                  </RadioGroup>

                  {selectedNominees[category.id] && !isLocked && (
                    <div className="space-y-2">
                      <Label htmlFor={`bet-${category.id}`}>Bet Amount</Label>
                      <Input
                        id={`bet-${category.id}`}
                        type="number"
                        min={0.01}
                        step={0.01}
                        placeholder="Enter bet amount"
                        value={betAmounts[category.id] || ""}
                        onChange={(e) =>
                          handleAmountChange(category.id, e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        className={cn("bg-input", {
                          "border-red-500": currentBalance < 0,
                        })}
                        disabled={isLocked}
                      />
                      <div className="flex justify-between text-sm">
                        <span>Min: $0.01</span>
                        <span>
                          {betAmounts[category.id]
                            ? `To win: $${(
                                (betAmounts[category.id] || 0) *
                                ((category.nominees.find(
                                  (n) => n.id === selectedNominees[category.id]
                                )?.odds ?? 0) -
                                  1)
                              ).toFixed(2)}`
                            : `Enter an amount`}
                        </span>
                      </div>
                    </div>
                  )}

                  {categoryWinner && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500 rounded-md">
                      <p className="text-green-500 font-medium">
                        Winner: {categoryWinner}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={disabled || isSubmitting}>
            {isSubmitting
              ? "Submitting..."
              : hasExistingBets
              ? "Update Bets"
              : "Submit Bets"}
          </Button>
        </div>
      </div>
    </form>
  );
}

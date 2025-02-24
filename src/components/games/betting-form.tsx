"use client";

import { useState } from "react";
import type { Category, Nominee, GameParticipant, Bet } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

    const maxForThisCategory = getMaxAmountForCategory(categoryId);
    if (numAmount > maxForThisCategory) return;

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

    // Check if all categories have nominees selected
    const missingCategories = categories.filter(
      (cat) => !selectedNominees[cat.id]
    );
    if (missingCategories.length > 0) {
      setError(
        `Please select nominees for all categories. Missing: ${missingCategories
          .map((c) => c.name)
          .join(", ")}`
      );
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
      setError(
        `Please enter bet amounts for all selections. Missing: ${missingCategories.join(
          ", "
        )}`
      );
      return;
    }

    // Calculate total bet amount
    const totalBetAmount = Object.values(betAmounts).reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Compare against initial balance - allow exact match
    if (totalBetAmount > initialBalance) {
      setError("Total bet amount exceeds your initial balance");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

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
        participant.balance = initialBalance - totalBetAmount;
      }

      const successMessageText = hasExistingBets
        ? `Bets successfully updated! Your new balance is $${participant.balance.toFixed(
            2
          )}.`
        : `Bets successfully placed! Your balance is now $${participant.balance.toFixed(
            2
          )}.`;

      setSuccessMessage(successMessageText);

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
      setError(
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

  return (
    <form onSubmit={submitBets} className="relative">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6">
        <div className="container max-w-7xl mx-auto py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Place Your Bets</h2>
              {hasExistingBets && !disabled && (
                <span className="text-muted-foreground">
                  (You can update your bets until the game is locked)
                </span>
              )}
            </div>
            <div className="text-xl">
              <div className="flex items-center gap-2">
                <span>Available: ${currentBalance.toFixed(2)}</span>
                {currentBalance <= 0 ? (
                  <span className="text-green-500 text-sm font-medium">
                    All funds allocated
                  </span>
                ) : currentBalance < initialBalance * 0.1 ? (
                  <span className="text-yellow-500 text-sm font-medium">
                    Low funds
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">
                Initial Balance: ${initialBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto mb-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          onClick={makeRandomBets}
          disabled={disabled}
        >
          Bet for me
        </Button>

        {currentBalance > 0 && !disabled && (
          <Button
            type="button"
            variant="outline"
            className="text-sm"
            onClick={distributeRemainingBalance}
          >
            Distribute Remaining ${currentBalance.toFixed(2)}
          </Button>
        )}
      </div>

      <div className="container max-w-7xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-green-500/10 border-green-500 text-green-500">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const existingBet = participant.bets.find(
              (bet) => bet.nominee?.category.id === category.id
            );
            const categoryWinner = category.winnerId
              ? category.nominees.find((n) => n.id === category.winnerId)?.name
              : null;
            const isLocked = disabled || category.winnerId !== null;

            return (
              <Card
                key={category.id}
                className={`bg-card ${isLocked ? "opacity-50" : ""}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{category.name}</CardTitle>
                    {isLocked && (
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
                    onValueChange={(value) =>
                      handleNomineeSelect(category.id, value)
                    }
                    value={selectedNominees[category.id]}
                    disabled={isLocked}
                  >
                    {category.nominees.map((nominee) => (
                      <div
                        key={nominee.id}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={nominee.id}
                          id={`${category.id}-${nominee.id}`}
                          disabled={isLocked}
                        />
                        <Label
                          htmlFor={`${category.id}-${nominee.id}`}
                          className="flex-1"
                        >
                          {nominee.name}
                          {nominee.id === existingBet?.nomineeId &&
                            !isLocked && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                (current pick)
                              </span>
                            )}
                        </Label>
                        <span className="text-muted-foreground">
                          {Math.round(nominee.odds * 100) / 100}x
                        </span>
                      </div>
                    ))}
                  </RadioGroup>

                  {selectedNominees[category.id] && !isLocked && (
                    <div className="space-y-2">
                      <Label htmlFor={`bet-${category.id}`}>Bet Amount</Label>
                      <Input
                        id={`bet-${category.id}`}
                        type="number"
                        min="1"
                        max={getMaxAmountForCategory(category.id)}
                        placeholder="Enter bet amount"
                        value={betAmounts[category.id] || ""}
                        onChange={(e) =>
                          handleAmountChange(category.id, e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        className="bg-input"
                        disabled={isLocked}
                      />
                      <div className="flex justify-between text-sm">
                        <span>Min: $1</span>
                        <span>
                          Max: $
                          {getMaxAmountForCategory(category.id).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {(categoryWinner || (disabled && categoryWinner)) && (
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

        <Button
          type="submit"
          className="w-full"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : hasExistingBets
            ? "Update Bets"
            : "Submit Bets"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  GameParticipant,
  User,
  Bet,
  Nominee,
  Category,
} from "@prisma/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Check, Crown, X } from "lucide-react";
import type { ParticipantWithUser } from "@/types/prisma";
import { CATEGORY_ORDER, getCategoryIndex } from "@/lib/kalshi-events";
import { effectiveOdds } from "@/lib/kalshi";

function formatDollars(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

interface GameViewProps {
  participants: ParticipantWithUser[];
  currentUserId: string;
}

export default function GameView({
  participants,
  currentUserId,
}: GameViewProps) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(
    null
  );

  const categoryOrder = CATEGORY_ORDER;

  function calcPotential(participant: ParticipantWithUser) {
    const pendingReturn = participant.bets.reduce((sum, bet) => {
      const hasWinner = bet.nominee.category.winnerId !== null;
      if (hasWinner) return sum; // already resolved, in balance
      const odds = effectiveOdds(bet.oddsAtTime ?? bet.nominee.odds);
      return sum + bet.amount * odds; // full return if they win
    }, 0);
    return participant.balance + pendingReturn;
  }

  // Sort by potential total (balance + pending winnings) descending
  const sortedParticipants = [...participants].sort(
    (a, b) => calcPotential(b) - calcPotential(a)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedParticipants.map((participant, index) => {
            const potential = calcPotential(participant);
            const hasPending = participant.bets.some(
              (b) => b.nominee.category.winnerId === null
            );
            return (
            <div
              key={participant.id}
              className={cn("space-y-2", {
                "border-l-4 border-primary pl-4":
                  participant.user.id === currentUserId,
              })}
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-normal w-6">
                      #{index + 1}
                    </span>
                    {participant.user.name}
                    {index === 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Balance: <span className="text-foreground font-medium">{formatDollars(participant.balance)}</span>
                    </span>
                    {hasPending && (
                      <span className="text-emerald-400">
                        Potential: <span className="font-medium">{formatDollars(potential)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    View Bets
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="font-medium">Category</TableCell>
                        <TableCell className="font-medium">Nominee</TableCell>
                        <TableCell className="font-medium">Amount</TableCell>
                        <TableCell className="font-medium">Odds</TableCell>
                        <TableCell className="font-medium">Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participant.bets
                        .sort((a, b) => {
                          const aIndex = categoryOrder.indexOf(
                            a.nominee.category.name
                          );
                          const bIndex = categoryOrder.indexOf(
                            b.nominee.category.name
                          );
                          return aIndex - bIndex;
                        })
                        .map((bet) => {
                          const hasWinner =
                            bet.nominee.category.winnerId !== null;
                          const isWinner =
                            hasWinner &&
                            bet.nominee.category.winnerId === bet.nomineeId;
                          const odds = effectiveOdds(
                            bet.oddsAtTime ?? bet.nominee.odds
                          );
                          const winAmount = isWinner
                            ? bet.amount * (odds - 1)
                            : 0;
                          const lossAmount =
                            !isWinner && hasWinner ? bet.amount : 0;

                          return (
                            <TableRow
                              key={bet.id}
                              className={cn({
                                "text-green-500 font-medium":
                                  hasWinner && isWinner,
                                "text-red-500 font-medium":
                                  hasWinner && !isWinner,
                              })}
                            >
                              <TableCell>{getCategoryIndex(bet.nominee.category.name)}. {bet.nominee.category.name}</TableCell>
                              <TableCell>{bet.nominee.name}</TableCell>
                              <TableCell>{formatDollars(bet.amount)}</TableCell>
                              <TableCell>
                                {effectiveOdds(
                                  bet.oddsAtTime ?? bet.nominee.odds
                                ).toFixed(2)}
                                x
                              </TableCell>
                              <TableCell>
                                {hasWinner ? (
                                  isWinner ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="h-4 w-4" />
                                      Won {formatDollars(winAmount)}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <X className="h-4 w-4" />
                                      Lost {formatDollars(lossAmount)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-emerald-400">
                                    →&nbsp;{formatDollars(bet.amount * odds)}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );})}
        </div>
      </CardContent>
    </Card>
  );
}

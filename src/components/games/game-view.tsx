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

  // Sort participants by balance in descending order
  const sortedParticipants = [...participants].sort(
    (a, b) => b.balance - a.balance
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedParticipants.map((participant, index) => (
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
                    {participant.user.name}
                    {index === 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Balance: ${participant.balance}
                  </p>
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
                      {participant.bets.map((bet) => {
                        const hasWinner =
                          bet.nominee.category.winnerId !== null;
                        const isWinner =
                          hasWinner &&
                          bet.nominee.category.winnerId === bet.nomineeId;
                        const winAmount = isWinner
                          ? bet.amount * bet.nominee.odds
                          : 0;
                        const lossAmount =
                          !isWinner && hasWinner ? bet.amount : 0;

                        return (
                          <TableRow key={bet.id}>
                            <TableCell>{bet.nominee.category.name}</TableCell>
                            <TableCell>{bet.nominee.name}</TableCell>
                            <TableCell>${bet.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              {bet.nominee.odds.toFixed(2)}x
                            </TableCell>
                            <TableCell>
                              {hasWinner ? (
                                isWinner ? (
                                  <span className="text-green-500 font-medium flex items-center gap-1">
                                    <Check className="h-4 w-4" />
                                    Won ${winAmount.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-medium flex items-center gap-1">
                                    <X className="h-4 w-4" />
                                    Lost ${lossAmount.toFixed(2)}
                                  </span>
                                )
                              ) : (
                                <span className="text-muted-foreground">
                                  Pending
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

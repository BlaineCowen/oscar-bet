"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  GameParticipant,
  User,
  Bet,
  Nominee,
  Category,
} from "@prisma/client";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleNameEdit = async (participantId: string, currentName: string) => {
    setEditingName(participantId);
    setNewName(currentName);
  };

  const handleNameSave = async (participantId: string) => {
    if (!participantId || !newName.trim()) return;
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error("Failed to update name");

      // Update state directly
      const updatedParticipants = participants.map((p) =>
        p.id === participantId
          ? { ...p, user: { ...p.user, name: newName } }
          : p
      );
      participants.splice(0, participants.length, ...updatedParticipants);
      setEditingName(null);
    } catch (error) {
      console.error("Error updating name:", error);
      setEditingName(null);
    }
  };

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
                    {editingName === participant.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-[200px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNameSave(participant.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingName(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        {participant.user.name}
                        {participant.user.id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleNameEdit(
                                participant.id,
                                participant.user.name ?? ""
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
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
                          const winAmount = isWinner
                            ? bet.amount * bet.nominee.odds
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
                              <TableCell>{bet.nominee.category.name}</TableCell>
                              <TableCell>{bet.nominee.name}</TableCell>
                              <TableCell>${bet.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                {bet.nominee.odds.toFixed(2)}x
                              </TableCell>
                              <TableCell>
                                {hasWinner ? (
                                  isWinner ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="h-4 w-4" />
                                      Won ${winAmount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
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

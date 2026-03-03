"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameView from "@/components/games/game-view";
import BettingForm from "@/components/games/betting-form";
import type { GameParticipant, Bet, Nominee, Category } from "@prisma/client";
import type { User } from "next-auth";
import type { ParticipantWithUser } from "@/types/prisma";

interface TabViewProps {
  participants: (GameParticipant & {
    user: User;
    bets: (Bet & {
      nominee: Nominee & {
        category: Category;
      };
    })[];
  })[];
  categories: (Category & {
    nominees: Nominee[];
    winner?: Nominee;
  })[];
  currentUserId: string;
  gameId: string;
  locked: boolean;
  isAdmin?: boolean;
  currentParticipant?: GameParticipant & {
    bets: (Bet & {
      nominee: Nominee & {
        category: Category;
      };
    })[];
  };
}

export default function TabView({
  participants,
  categories,
  currentUserId,
  gameId,
  locked,
  isAdmin,
  currentParticipant,
}: TabViewProps) {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const hasSetInitialTab = useRef(false);

  // Switch to betting tab once participant data first loads — only once
  useEffect(() => {
    if (!hasSetInitialTab.current && (currentParticipant || isAdmin)) {
      hasSetInitialTab.current = true;
      setActiveTab("betting");
    }
  }, [currentParticipant, isAdmin]);

  // Check if the current user is a participant in the game
  const isParticipant =
    isAdmin ||
    participants.some((participant) => participant.user.id === currentUserId);

  // Convert participants to ParticipantWithUser type and set balance to 0 for those without bets
  const typedParticipants: ParticipantWithUser[] = participants.map((p) => ({
    ...p,
    balance: p.bets.length === 0 ? 0 : p.balance,
    user: {
      id: p.user.id ?? "",
      name: p.user.name ?? null,
      email: p.user.email ?? "",
    },
  }));

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger
          value="betting"
          disabled={!isParticipant && !isAdmin}
        >
          Place Bets
        </TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="leaderboard" className="mt-0">
        <GameView
          participants={typedParticipants}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="betting" className="mt-0">
        {currentParticipant ? (
          <BettingForm
            categories={categories}
            participant={currentParticipant}
            gameId={gameId}
            userId={currentUserId}
            disabled={locked}
          />
        ) : isAdmin ? (
          <div className="text-center py-10 text-muted-foreground">
            Loading your participant data...
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

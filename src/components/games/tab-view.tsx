"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameView from "@/components/games/game-view";
import BettingForm from "@/components/games/betting-form";
import type {
  GameParticipant,
  User,
  Bet,
  Nominee,
  Category,
} from "@prisma/client";

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
  currentParticipant,
}: TabViewProps) {
  const [activeTab, setActiveTab] = useState("leaderboard");

  // Check if the current user is a participant in the game
  const isParticipant = participants.some(
    (participant) => participant.user.id === currentUserId
  );

  return (
    <Tabs
      defaultValue="leaderboard"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger
          value="betting"
          disabled={!isParticipant || !currentParticipant}
        >
          Place Bets
        </TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="leaderboard" className="mt-0">
        <GameView participants={participants} currentUserId={currentUserId} />
      </TabsContent>

      <TabsContent value="betting" className="mt-0">
        {currentParticipant && (
          <BettingForm
            categories={categories}
            participant={currentParticipant}
            gameId={gameId}
            userId={currentUserId}
            disabled={locked}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

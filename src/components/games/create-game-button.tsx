"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function CreateGameButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useAuth();
  const userId = session?.user?.id;

  const createGame = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name: "Oscars 2024",
          startDate: new Date().toISOString(),
          endDate: new Date(2024, 2, 10).toISOString(), // March 10, 2024
          initialBalance: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const game = await response.json();
      router.push(`/games/${game.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={createGame}
      disabled={isLoading || !userId}
      className="bg-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
    >
      {isLoading ? "Creating..." : "Create Game"}
    </button>
  );
}

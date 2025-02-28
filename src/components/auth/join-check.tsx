"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function JoinCheck() {
  const router = useRouter();
  const { session, status } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "loading") return;

    const joinInfoStr = localStorage.getItem("joinAfterAuth");
    if (!joinInfoStr) return;

    console.log("Found join info:", joinInfoStr);
    const joinInfo = JSON.parse(joinInfoStr);
    if (!joinInfo?.code || !joinInfo?.gameId) {
      console.log("Invalid join info, removing from storage");
      localStorage.removeItem("joinAfterAuth");
      return;
    }

    if (session?.user?.id) {
      console.log("User is authenticated, attempting to join game:", joinInfo);
      // First verify the code is still valid
      fetch(`/api/games/verify-code/${joinInfo.code}`)
        .then(async (res) => {
          const data = await res.json();
          console.log("Verify code response:", data);
          if (res.ok && data.id === joinInfo.gameId) {
            // Code is valid, try to join the game
            return fetch(`/api/games/${joinInfo.gameId}/join`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": session.user.id,
              },
              body: JSON.stringify({ code: joinInfo.code }),
            });
          } else {
            throw new Error(data.error || "Invalid join link");
          }
        })
        .then(async (res) => {
          if (!res) throw new Error("Failed to join game");
          const data = await res.json();
          console.log("Join game response:", data);
          if (res.ok) {
            // Invalidate games query to force a refresh
            queryClient.invalidateQueries({ queryKey: ["games"] });
            toast.success("Successfully joined the game!");
            router.push(`/games/${joinInfo.gameId}`);
          } else {
            if (data.error === "You have already joined this game") {
              router.push(`/games/${joinInfo.gameId}`);
            } else {
              throw new Error(data.error || "Failed to join game");
            }
          }
        })
        .catch((error) => {
          console.error("Error joining game:", error);
          toast.error(error.message || "Failed to join game");
          router.push("/games");
        })
        .finally(() => {
          localStorage.removeItem("joinAfterAuth");
        });
    }
  }, [router, session, status, queryClient]);

  return null;
}

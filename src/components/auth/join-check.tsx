"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function JoinCheck() {
  const router = useRouter();
  const { data: session, status } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkForPendingJoin = async () => {
      // Only run once per session and only when authenticated
      if (hasChecked || status !== "success" || !session?.user?.id) return;
      setHasChecked(true);

      try {
        // Check if we have pending join info
        const joinInfoStr = localStorage.getItem("joinAfterAuth");
        if (!joinInfoStr) return;

        const joinInfo = JSON.parse(joinInfoStr);
        if (!joinInfo?.code || !joinInfo?.gameId) return;

        console.log("Found pending join info, attempting to join game...");

        // Try to join the game
        const response = await fetch(`/api/games/${joinInfo.gameId}/join`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session.user.id,
          },
          body: JSON.stringify({ code: joinInfo.code }),
        });

        if (response.ok) {
          toast.success("Successfully joined the game!");
          router.push(`/games/${joinInfo.gameId}`);
        } else {
          const error = await response.json();
          console.error("Failed to join game:", error);
          toast.error(`Failed to join game: ${error.error || "Unknown error"}`);
        }

        // Clean up stored info regardless of success/failure
        localStorage.removeItem("joinAfterAuth");
      } catch (error) {
        console.error("Error handling join after auth:", error);
        localStorage.removeItem("joinAfterAuth");
      }
    };

    checkForPendingJoin();
  }, [status, session, router, hasChecked]);

  // This is a utility component with no UI
  return null;
}

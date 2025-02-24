"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function AuthCallback() {
  const router = useRouter();

  // Check for stored join code info
  useEffect(() => {
    const handlePostAuthRedirect = async () => {
      try {
        const joinInfoStr = localStorage.getItem("joinAfterAuth");

        if (joinInfoStr) {
          // Parse the stored join information
          const joinInfo = JSON.parse(joinInfoStr);

          if (joinInfo?.code && joinInfo?.gameId) {
            // Get the user's ID
            const authData = await authClient.getSession();
            const userId = authData?.data?.user?.id;

            if (userId) {
              // Attempt to join the game with the code
              const response = await fetch(
                `/api/games/${joinInfo.gameId}/join`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                  },
                  body: JSON.stringify({ code: joinInfo.code }),
                }
              );

              if (response.ok) {
                toast.success("Successfully joined the game!");
                router.push(`/games/${joinInfo.gameId}`);
              } else {
                const error = await response.json();
                toast.error(
                  `Failed to join game: ${error.error || "Unknown error"}`
                );
                router.push("/");
              }
            } else {
              router.push("/");
            }

            // Clean up stored info
            localStorage.removeItem("joinAfterAuth");
            return;
          }
        }

        // If no join info, redirect to the dashboard
        router.push("/");
      } catch (error) {
        console.error("Error during post-auth redirect:", error);
        toast.error("Something went wrong during login");
        router.push("/");
        localStorage.removeItem("joinAfterAuth");
      }
    };

    handlePostAuthRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
        <p className="text-muted-foreground">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
}

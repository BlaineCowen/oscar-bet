"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type PageProps = {
  params: { code: string };
  searchParams: { gameId?: string };
};

export default function JoinPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  const { session, status } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [gameDetails, setGameDetails] = useState<any>(null);

  useEffect(() => {
    const { code } = params;
    console.log("Join page mounted. Code:", code);

    if (!code) {
      console.error("No code provided");
      toast.error("Invalid join link");
      router.push("/");
      return;
    }

    // First verify the code is valid
    console.log("Verifying code...");
    fetch(`/api/games/verify-code/${code}`)
      .then(async (res) => {
        const data = await res.json();
        console.log("Verify code response:", data);
        if (res.ok) {
          setGameDetails(data);
          // If we don't have gameId in searchParams, use the one from verification
          if (!searchParams.gameId) {
            console.log("Using gameId from verification:", data.id);
            searchParams.gameId = data.id;
          }
        } else {
          console.error("Invalid code:", data.error);
          toast.error(data.error || "Invalid join link");
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("Error verifying code:", error);
        toast.error("Failed to verify join link");
        router.push("/");
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [params, router]);

  useEffect(() => {
    if (status === "loading" || isVerifying || !gameDetails) return;

    const { code } = params;
    const gameId = searchParams.gameId || gameDetails.id;

    console.log("Attempting to join game. Status:", {
      code,
      gameId,
      userId: session?.user?.id,
      isVerifying,
      hasGameDetails: !!gameDetails,
    });

    if (session?.user?.id) {
      // User is authenticated, try to join the game
      console.log("User is authenticated, joining game...");
      fetch(`/api/games/${gameId}/join`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          const data = await res.json();
          console.log("Join game response:", data);
          if (res.ok) {
            toast.success("Successfully joined the game!");
            router.push(`/games/${gameId}`);
          } else {
            if (data.error === "You have already joined this game") {
              router.push(`/games/${gameId}`);
            } else {
              console.error("Join error:", data.error);
              toast.error(data.error || "Failed to join game");
              router.push("/games");
            }
          }
        })
        .catch((error) => {
          console.error("Error joining game:", error);
          router.push("/games");
        });
    } else {
      // Store join info and redirect to register
      console.log(
        "User not authenticated, storing join info and redirecting to register"
      );
      localStorage.setItem("joinAfterAuth", JSON.stringify({ code, gameId }));
      router.push("/register");
    }
  }, [params, searchParams, router, session, status, isVerifying, gameDetails]);

  if (isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Verifying join link...</h1>
          <p className="text-gray-600">
            Please wait while we verify your invitation.
          </p>
        </div>
      </div>
    );
  }

  if (!session && gameDetails) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold">Join {gameDetails.name}</h1>
          <p className="text-gray-600">
            You've been invited to join this Oscar predictions game. Please sign
            in or create an account to continue.
          </p>
          <div className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Joining game...</h1>
        <p className="text-gray-600">
          Please wait while we process your request.
        </p>
      </div>
    </div>
  );
}

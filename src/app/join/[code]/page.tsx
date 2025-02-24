"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { use } from "react";

export default function JoinGamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // Unwrap params Promise
  const unwrappedParams = use(params);
  const code = unwrappedParams.code;

  const router = useRouter();
  const { data: session, status } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // First verify the code is valid
  useEffect(() => {
    const verifyCode = async () => {
      try {
        const response = await fetch(`/api/games/verify-code/${code}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Invalid invite code");
        }

        const game = await response.json();
        setGameDetails(game);
        setIsVerifying(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to verify invite code"
        );
        setIsVerifying(false);
      }
    };

    if (code) {
      verifyCode();
    }
  }, [code]);

  // Handle join if user is authenticated
  useEffect(() => {
    // Wait for auth and code verification to complete
    if (status === "pending" || isVerifying) return;

    // If user is authenticated and we have a valid game, join automatically
    if (status === "success" && gameDetails && !isJoining && !error) {
      handleJoinGame();
    }
  }, [status, gameDetails, isVerifying]);

  const handleJoinGame = async () => {
    if (!gameDetails || !session?.user?.id) return;

    setIsJoining(true);

    try {
      const response = await fetch(`/api/games/${gameDetails.id}/join`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join game");
      }

      // Success! Redirect to the game
      toast.success(`You've joined "${gameDetails.name}"!`);
      router.push(`/games/${gameDetails.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setIsJoining(false);
    }
  };

  const handleSignIn = () => {
    // Save redirect info to localStorage
    localStorage.setItem(
      "joinAfterAuth",
      JSON.stringify({
        code,
        gameId: gameDetails?.id,
      })
    );

    // Redirect to sign in with callback URL to our auth callback page
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/auth/callback`
    );
    router.push(`/sign-in?callbackUrl=${callbackUrl}`);
  };

  // Handle loading states
  if (isVerifying) {
    return (
      <div className="container max-w-md py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Verifying Invite</CardTitle>
            <CardDescription>
              Please wait while we verify your invite code
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error states
  if (error) {
    return (
      <div className="container max-w-md py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} className="w-full">
          Go Home
        </Button>
      </div>
    );
  }

  // Game is valid but user is not logged in
  if (status === "error" && gameDetails) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center">
              Join "{gameDetails.name}"
            </CardTitle>
            <CardDescription className="text-center">
              You need to sign in or create an account to join this game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              This game was created by{" "}
              {gameDetails.admin?.name || "an administrator"}. Join to predict
              Oscar winners and compete with friends!
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={handleSignIn} className="w-full">
              Sign in to join
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="container max-w-md py-12">
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Joining Game</CardTitle>
          <CardDescription>
            Please wait while we add you to the game
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

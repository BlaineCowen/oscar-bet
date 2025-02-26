"use client";

import { useEffect } from "react";
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

type PageProps = {
  params: { code: string };
  searchParams: { gameId: string };
};

export default function JoinPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  const { session, status } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    const { code } = params;
    const { gameId } = searchParams;

    if (!code || !gameId) {
      router.push("/");
      return;
    }

    if (session?.user?.id) {
      // User is authenticated, try to join the game
      fetch(`/api/games/${gameId}/join`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (res.ok) {
            router.push(`/games/${gameId}`);
          } else {
            router.push("/");
          }
        })
        .catch(() => {
          router.push("/");
        });
    } else {
      // Store join info and redirect to login
      localStorage.setItem("joinAfterAuth", JSON.stringify({ code, gameId }));
      router.push("/login");
    }
  }, [params, searchParams, router, session, status]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Joining game...</h1>
        <p className="text-gray-600">
          Please wait while we process your request.
        </p>
      </div>
    </div>
  );
}

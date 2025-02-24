"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useUserId } from "@/hooks/useAuth";

interface InviteCodeCardProps {
  gameId: string;
  isAdmin: boolean;
  currentCode?: string | null;
}

export default function InviteCodeCard({
  gameId,
  isAdmin,
  currentCode,
}: InviteCodeCardProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(
    currentCode || null
  );
  const queryClient = useQueryClient();
  const userId = useUserId();

  const generateCode = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/games/${gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate invite code");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setInviteCode(data.code);
      queryClient.invalidateQueries({ queryKey: ["games", gameId] });
      toast.success("New invite code generated!");
    },
    onError: (error) => {
      console.error("Error generating code:", error);
      toast.error(
        `Error: ${
          error instanceof Error ? error.message : "Failed to generate code"
        }`
      );
    },
  });

  const copyToClipboard = () => {
    if (!inviteCode) return;

    // Create join URL
    const joinUrl = `${window.location.origin}/join/${inviteCode}`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => {
        toast.success("Invite link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy invite link");
      });
  };

  const shareInvite = () => {
    if (!inviteCode) return;

    const joinUrl = `${window.location.origin}/join/${inviteCode}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Join my Oscar Predictions game",
          text: "Click this link to join my Oscar Predictions game!",
          url: joinUrl,
        })
        .then(() => toast.success("Invite shared!"))
        .catch((error) => {
          console.error("Error sharing:", error);
          toast.error("Failed to share invite");
        });
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Invite Players</CardTitle>
        <CardDescription>
          Share this code with friends to invite them to your game.
          {inviteCode ? " The code is valid for 24 hours." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteCode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/join/${inviteCode}`}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={shareInvite}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => generateCode.mutate()}
              disabled={generateCode.isPending || !userId}
              className="w-full"
            >
              {generateCode.isPending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Generate New Code
                </span>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => generateCode.mutate()}
            disabled={generateCode.isPending || !userId}
            className="w-full"
          >
            {generateCode.isPending ? "Generating..." : "Generate Invite Code"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

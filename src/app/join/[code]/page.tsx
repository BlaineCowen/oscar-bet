"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface GameInfo {
  id: string;
  name: string;
  admin: { name: string | null };
}

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();

  const [game, setGame] = useState<GameInfo | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/games/verify-code/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGame(data);
      })
      .catch(() => setError("Failed to verify code"))
      .finally(() => setVerifying(false));
  }, [code]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!game || !name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/games/${game.id}/join`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name: name.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to join game");
      setLoading(false);
      return;
    }

    router.push(`/games/${game.id}`);
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verifying invite code…</p>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {game?.name}</CardTitle>
          <CardDescription>
            Hosted by {game?.admin?.name ?? "Admin"} · Enter your name to start playing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="e.g. Blaine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? "Joining…" : "Join Game"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function JoinCheck() {
  const router = useRouter();
  const { session, status } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    const joinInfoStr = localStorage.getItem("joinAfterAuth");
    if (!joinInfoStr) return;

    const joinInfo = JSON.parse(joinInfoStr);
    if (!joinInfo?.code || !joinInfo?.gameId) return;

    if (session?.user?.id) {
      // User is authenticated, try to join the game
      fetch(`/api/games/${joinInfo.gameId}/join`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: joinInfo.code }),
      })
        .then((res) => {
          if (res.ok) {
            router.push(`/games/${joinInfo.gameId}`);
          } else {
            router.push("/");
          }
        })
        .catch(() => {
          router.push("/");
        })
        .finally(() => {
          localStorage.removeItem("joinAfterAuth");
        });
    }
  }, [router, session, status]);

  return null;
}

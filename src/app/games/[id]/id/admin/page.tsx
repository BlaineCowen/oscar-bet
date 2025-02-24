"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminPanel } from "@/components/games/admin/admin-panel";
import { useIsGameAdmin } from "../../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import type { GameWithRelations } from "@/types/prisma";

export default function AdminPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: game, isLoading } = useQuery<GameWithRelations>({
    queryKey: ["games", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/games/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch game");
      }
      return response.json();
    },
  });

  const isAdmin = useIsGameAdmin(game);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  if (!isAdmin) {
    router.push(`/games/${params.id}`);
    return null;
  }

  return <AdminPanel game={game} />;
}

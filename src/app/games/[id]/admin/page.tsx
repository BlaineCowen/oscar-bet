import { prisma } from "@/lib/prisma";
import AdminModal from "./admin-modal";
import { notFound } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: { id: string };
}) {
  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          nominees: true,
        },
      },
    },
  });

  if (!game) {
    notFound();
  }

  return <AdminModal gameId={game.id} categories={game.categories} />;
}

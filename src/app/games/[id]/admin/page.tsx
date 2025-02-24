import { prisma } from "@/lib/prisma";
import AdminModal from "./admin-modal";
import { notFound } from "next/navigation";

export default async function AdminPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
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

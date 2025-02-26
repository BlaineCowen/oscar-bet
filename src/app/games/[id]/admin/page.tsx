import { prisma } from "@/lib/prisma";
import AdminModal from "./admin-modal";
import { notFound } from "next/navigation";

type PageProps = {
  params: { id: string };
};

export default async function AdminPage({ params }: PageProps) {
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

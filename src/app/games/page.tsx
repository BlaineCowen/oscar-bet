import { GamesList } from "@/components/games/games-list";
import { CreateGameButton } from "@/components/games/create-game-button";

export default async function GamesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Games</h1>
        <CreateGameButton />
      </div>
      <GamesList />
    </main>
  );
}

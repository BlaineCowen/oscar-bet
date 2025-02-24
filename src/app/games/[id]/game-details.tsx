"use client";

import { useRouter } from "next/navigation";

interface Nominee {
  id: string;
  name: string;
  odds: number;
}

interface Category {
  id: string;
  name: string;
  nominees: Nominee[];
  winner?: string;
}

interface Game {
  id: string;
  name: string;
  categories: Category[];
}

interface Props {
  game: Game;
  isAdmin: boolean;
}

export function GameDetails({ game, isAdmin }: Props) {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">{game.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {game.categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
            <div className="space-y-4">
              {category.nominees.map((nominee) => (
                <div
                  key={nominee.id}
                  className="flex justify-between items-center"
                >
                  <span>{nominee.name}</span>
                  <span className="text-gold">{nominee.odds}x</span>
                </div>
              ))}
            </div>
            {category.winner && (
              <div className="mt-4 text-green-500">
                Winner: {category.winner}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-8">
          <button
            onClick={() => router.push(`/games/${game.id}/admin`)}
            className="bg-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-gold/90 transition-colors"
          >
            Manage Game
          </button>
        </div>
      )}
    </div>
  );
}

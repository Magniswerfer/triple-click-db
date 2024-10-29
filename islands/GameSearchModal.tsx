import { useState } from "preact/hooks";
import { IGDBGame, Game, GameReference } from "../types.ts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGameSelect: (game: GameReference) => void;
}

export default function GameSearchModal({ isOpen, onClose, onGameSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error("Search failed");
      
      const games = await response.json();
      setResults(games);
    } catch (err) {
      setError("Failed to search games. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGameSelect(igdbGame: IGDBGame) {
    try {
      // First, ensure the game is stored in our system
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igdbId: igdbGame.id })
      });

      if (!response.ok) throw new Error("Failed to save game");
      
      const savedGame = await response.json();
      
      // Create the game reference and pass it back
      onGameSelect({
        id: savedGame.id,
        title: savedGame.title,
        igdbId: savedGame.igdbId
      });
      
      onClose();
    } catch (err) {
      setError("Failed to add game. Please try again.");
      console.error(err);
    }
  }

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-4 border-b">
          <h2 class="text-xl font-semibold">Add Game</h2>
        </div>

        <div class="p-4 border-b">
          <div class="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for a game..."
              class="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <div class="text-red-500 mt-2">{error}</div>}
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          {results.length > 0 ? (
            <div class="space-y-4">
              {results.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  class="w-full text-left p-4 border rounded hover:bg-gray-50 flex gap-4"
                >
                  {game.cover && (
                    <img
                      src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`}
                      alt={game.name}
                      class="w-16 h-20 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 class="font-medium">{game.name}</h3>
                    {game.first_release_date && (
                      <div class="text-sm text-gray-500">
                        {new Date(game.first_release_date * 1000).getFullYear()}
                      </div>
                    )}
                    {game.summary && (
                      <p class="text-sm text-gray-600 mt-1 line-clamp-2">{game.summary}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div class="text-center text-gray-500 py-8">
              {searchTerm ? "No games found" : "Search for a game to add"}
            </div>
          )}
        </div>

        <div class="p-4 border-t">
          <button
            onClick={onClose}
            class="w-full px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

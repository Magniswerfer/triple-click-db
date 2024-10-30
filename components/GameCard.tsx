import { Game } from "../types.ts";

interface BaseGameCardProps {
  game: Game;
  variant?: "default" | "most-discussed";
  mentionCount?: number;
  showGenres?: boolean;
}

export function GameCard({ 
  game, 
  variant = "default",
  mentionCount,
  showGenres = true 
}: BaseGameCardProps) {
  const isDiscussed = variant === "most-discussed";
  
  return (
    <a
      href={`/games/${encodeURIComponent(game.id)}`}
      class={`block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isDiscussed ? "bg-gradient-to-br from-primary-50 to-white" : ""
      }`}
    >
      <div class="flex gap-4">
        {game.cover && (
          <img
            src={game.cover}
            alt={game.title}
            class="w-16 h-20 object-cover rounded"
          />
        )}
        <div>
          <h3 class="font-semibold mb-1">{game.title}</h3>
          {mentionCount !== undefined && (
            <div class={`text-sm ${isDiscussed ? "text-accent-500 font-medium" : "text-secondary-800"}`}>
              Mentioned in {mentionCount} episode{mentionCount !== 1 ? "s" : ""}
            </div>
          )}
          {game.releaseDate && (
            <div class="text-sm text-secondary-500">
              {new Date(game.releaseDate).getFullYear()}
            </div>
          )}
        </div>
      </div>

      {showGenres && game.genres && game.genres.length > 0 && (
        <div class="mt-2 flex flex-wrap gap-1">
          {game.genres.slice(0, 3).map(genre => (
            <span 
              key={genre} 
              class="text-xs bg-primary-50 text-secondary-800 px-2 py-0.5 rounded"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

// Convenience wrapper for most discussed games
interface MostDiscussedGameCardProps {
  game: Game & { mentionCount: number };
}

export function MostDiscussedGameCard({ game }: MostDiscussedGameCardProps) {
  return (
    <GameCard
      game={game}
      variant="most-discussed"
      mentionCount={game.mentionCount}
      showGenres={false}
    />
  );
}

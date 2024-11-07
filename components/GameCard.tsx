import { Game } from "../types.ts";

interface BaseGameCardProps {
  game: Game;
  variant?: "default" | "most-discussed";
  mentionCount?: number;
  showGenres?: boolean;
}

function getCoverUrl(cover: Game['cover']): string | undefined {
  if (!cover) return undefined;
  if (typeof cover === 'string') {
    return cover;
  }
  return cover.thumbnail;
}

function GameCard({
  game,
  variant = "default",
  mentionCount,
  showGenres = true
}: BaseGameCardProps) {
  const isDiscussed = variant === "most-discussed";
  const imageUrl = getCoverUrl(game.cover);

  return (
    <a
      href={`/games/${encodeURIComponent(game.id)}`}
      class={`block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${isDiscussed ? "bg-gradient-to-br from-primary-50 to-white" : ""
        }`}
    >
      <div class="flex gap-4">
        {game.cover && (
          <img
            src={imageUrl}
            alt={game.title}
            class="w-16 h-20 object-cover rounded"
            loading="lazy"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              console.error('Error event:', e);
            }}
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

interface MostDiscussedGameCardProps {
  game: Game & { mentionCount: number };
}

function MostDiscussedGameCard({ game }: MostDiscussedGameCardProps) {
  return (
    <GameCard
      game={game}
      variant="most-discussed"
      mentionCount={game.mentionCount}
      showGenres={false}
    />
  );
}

// Keep the skeleton for initial page load
function GameCardSkeleton({ variant = "default" }: { variant?: "default" | "most-discussed" }) {
  const isDiscussed = variant === "most-discussed";
  return (
    <div class={`block p-4 border rounded-lg shadow-sm ${isDiscussed ? "bg-gradient-to-br from-primary-50 to-white" : ""
      }`}>
      <div class="flex gap-4">
        <div class="w-16 h-20 bg-light-200 animate-pulse rounded" />
        <div class="flex-1">
          <div class="h-5 bg-light-200 animate-pulse rounded mb-2 w-3/4" />
          <div class="h-4 bg-light-200 animate-pulse rounded mb-1 w-1/2" />
          <div class="h-4 bg-light-200 animate-pulse rounded w-1/3" />
        </div>
      </div>
      <div class="mt-2 flex gap-1">
        <div class="h-5 w-16 bg-light-200 animate-pulse rounded" />
        <div class="h-5 w-16 bg-light-200 animate-pulse rounded" />
        <div class="h-5 w-16 bg-light-200 animate-pulse rounded" />
      </div>
    </div>
  );
}

export { GameCard, MostDiscussedGameCard, GameCardSkeleton };

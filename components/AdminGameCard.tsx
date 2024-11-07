import { Game } from "../types.ts";

interface AdminGameCardProps extends BaseGameCardProps {
  isPick?: boolean;
  onTogglePick?: (gameId: string, isPick: boolean) => void;
}

function AdminGameCard({
  game,
  variant = "default",
  mentionCount,
  showGenres = true,
  isPick = false,
  onTogglePick
}: AdminGameCardProps) {
  const isDiscussed = variant === "most-discussed";
  const imageUrl = getCoverUrl(game.cover);

  // Prevent the card's link behavior when clicking the button
  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTogglePick?.(game.id, !isPick);
  };

  return (
    <div class="relative">
      <a
        href={`/games/${encodeURIComponent(game.id)}`}
        class={`block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
          isDiscussed ? "bg-gradient-to-br from-primary-50 to-white" : ""
        }`}
      >
        <div class="flex gap-4">
          {game.cover && (
            <img
              src={imageUrl}
              alt={game.title}
              class="w-16 h-20 object-cover rounded"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                console.error('Error event:', e);
              }}
            />
          )}
          <div>
            <div class="flex items-start justify-between">
              <h3 class="font-semibold mb-1">{game.title}</h3>
              {isPick && (
                <span class="ml-2 text-xs bg-accent-500 text-white px-2 py-0.5 rounded">
                  Triple Click Pick
                </span>
              )}
            </div>
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
      {onTogglePick && (
        <button
          onClick={handleButtonClick}
          class={`absolute top-2 right-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
            isPick
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          {isPick ? "Remove Pick" : "Add Pick"}
        </button>
      )}
    </div>
  );
}

export { AdminGameCard };

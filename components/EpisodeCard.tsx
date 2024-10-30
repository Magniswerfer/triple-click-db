import { Episode } from "../types.ts";

interface Props {
  episode: Episode;
  showFullContent?: boolean;
}

export function EpisodeCard({ episode, showFullContent = false }: Props) {
  return (
    <div class="border rounded-lg p-4 shadow-sm">
      <a 
        href={`/episodes/${episode.id}`}
        class="block mb-4 hover:text-secondary-500 transition-colors"
      >
        <h2 class="text-xl font-semibold">
          #{episode.episodeNumber} - {episode.title}
        </h2>
        <p class="text-secondary-400 mt-1">
          {new Date(episode.date).toLocaleDateString()}
        </p>
      </a>

      {showFullContent ? (
        <p class="mb-4">{episode.sections.mainText}</p>
      ) : (
        <p class="mb-4 line-clamp-3">{episode.sections.mainText}</p>
      )}

      {episode.games && episode.games.length > 0 && (
        <div>
          <h3 class="font-medium mb-2">Games Discussed:</h3>
          <div class="flex flex-wrap gap-2">
            {episode.games.map((game) => (
              <a
                key={game.id}
                href={`/games/${encodeURIComponent(game.id)}`}
                class="bg-primary-50 text-secondary-800 px-2 py-1 rounded-full text-sm hover:bg-primary-100"
              >
                {game.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

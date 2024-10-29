import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import { Episode, Game, GameReference } from "../../types.ts";

interface GamePageData {
  game: Game;
  episodes: Episode[];
  relatedGames: Game[];
}

export const handler: Handlers<GamePageData> = {
  async GET(_req, ctx) {
    const gameId = ctx.params.game;
    
    // Get the game details
    const gameEntry = await kv.get<Game>(["games", gameId]);
    if (!gameEntry.value) {
      return new Response("Game not found", { status: 404 });
    }
    const game = gameEntry.value;

    // Get all episodes that mention this game
    const entries = await kv.list<Episode>({ prefix: ["episodes"] });
    const episodes = [];
    const relatedGameIds = new Set<string>();

    // Collect episodes and related game IDs
    for await (const entry of entries) {
      const episode = entry.value;
      if (episode.games?.some(g => g.id === gameId)) {
        episodes.push(episode);
        
        // Collect related game IDs, excluding the current game
        episode.games
          .filter(g => g.id !== gameId)
          .forEach(g => relatedGameIds.add(g.id));
      }
    }

    // Sort episodes by date
    episodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Fetch related game details
    const relatedGames: Game[] = [];
    for (const relatedId of relatedGameIds) {
      const relatedEntry = await kv.get<Game>(["games", relatedId]);
      if (relatedEntry.value) {
        relatedGames.push(relatedEntry.value);
      }
    }

    return ctx.render({
      game,
      episodes,
      relatedGames,
    });
  },
};

export default function GamePage({ data }: PageProps<GamePageData>) {
  const { game, episodes, relatedGames } = data;

  return (
    <Layout>
      <Head>
        <title>{game.title} - Triple Click Discussions</title>
      </Head>

      <nav class="mb-6">
        <a href="/games" class="text-blue-600 hover:underline">
          ← Back to all games
        </a>
      </nav>

      <div class="grid gap-6 lg:grid-cols-3">
        {/* Game info */}
        <div class="lg:col-span-1">
          <div class="sticky top-4">
            <div class="border rounded-lg p-4 shadow-sm">
              {game.cover && (
                <img
                  src={game.cover}
                  alt={game.title}
                  class="w-full rounded-lg mb-4"
                />
              )}
              <h1 class="text-2xl font-bold mb-2">{game.title}</h1>
              
              {game.releaseDate && (
                <div class="mb-2 text-gray-600">
                  Released: {new Date(game.releaseDate).toLocaleDateString()}
                </div>
              )}

              {game.companies && (
                <div class="mb-4">
                  {game.companies.developer.length > 0 && (
                    <div class="mb-2">
                      <div class="text-sm font-medium text-gray-500">Developer</div>
                      <div>{game.companies.developer.join(", ")}</div>
                    </div>
                  )}
                  {game.companies.publisher.length > 0 && (
                    <div>
                      <div class="text-sm font-medium text-gray-500">Publisher</div>
                      <div>{game.companies.publisher.join(", ")}</div>
                    </div>
                  )}
                </div>
              )}

              {game.platforms && game.platforms.length > 0 && (
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 mb-1">Platforms</div>
                  <div class="flex flex-wrap gap-1">
                    {game.platforms.map(platform => (
                      <span key={platform} class="bg-gray-100 text-gray-800 text-sm px-2 py-0.5 rounded">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.genres && game.genres.length > 0 && (
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 mb-1">Genres</div>
                  <div class="flex flex-wrap gap-1">
                    {game.genres.map(genre => (
                      <span key={genre} class="bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.summary && (
                <div>
                  <div class="text-sm font-medium text-gray-500 mb-1">About</div>
                  <p class="text-sm">{game.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Episodes and related content */}
        <div class="lg:col-span-2">
          <h2 class="text-xl font-bold mb-4">
            Discussed in {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
          </h2>

          <div class="space-y-6">
            {episodes.map((episode) => (
              <div key={episode.id} class="border rounded-lg p-4 shadow-sm">
                <h3 class="text-xl font-semibold mb-2">
                  #{episode.episodeNumber} - {episode.title}
                </h3>
                <p class="text-gray-600 mb-2">
                  {new Date(episode.date).toLocaleDateString()}
                </p>
                <p class="mb-4">{episode.sections.mainText}</p>

                {episode.games.length > 1 && (
                  <div>
                    <h4 class="font-medium mb-2">Other Games Discussed:</h4>
                    <div class="flex flex-wrap gap-2">
                      {episode.games
                        .filter((g) => g.id !== game.id)
                        .map((g) => (
                          <a
                            key={g.id}
                            href={`/games/${encodeURIComponent(g.id)}`}
                            class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm hover:bg-blue-200"
                          >
                            {g.title}
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {relatedGames.length > 0 && (
            <div class="mt-8">
              <h2 class="text-xl font-bold mb-4">Related Games</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                {relatedGames.map((relatedGame) => (
                  <a
                    key={relatedGame.id}
                    href={`/games/${encodeURIComponent(relatedGame.id)}`}
                    class="block p-3 border rounded hover:shadow-md transition-shadow"
                  >
                    <div class="flex gap-3">
                      {relatedGame.cover && (
                        <img
                          src={relatedGame.cover}
                          alt={relatedGame.title}
                          class="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 class="font-medium">{relatedGame.title}</h3>
                        {relatedGame.releaseDate && (
                          <div class="text-sm text-gray-500">
                            {new Date(relatedGame.releaseDate).getFullYear()}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

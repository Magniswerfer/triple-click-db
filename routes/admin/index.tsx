import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import EpisodeManager from "../../islands/EpisodeManager.tsx";
import { Episode, Game } from "../../types.ts";
import { searchGames } from "../../utils/igdb.ts";
import { GameCard } from "../../components/GameCard.tsx";

export const handler: Handlers<{
  episodes: Episode[];
  searchResults: Game[];
  tripleClickPicks: Game[];
}> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q");

    // Fetch all episodes for Episode Management
    const entries = kv.list<Episode>({ prefix: ["episodes"] });
    const episodes: Episode[] = [];
    for await (const entry of entries) {
      episodes.push(entry.value);
    }
    // Sort by episode number in descending order
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);

    // Initialize search results array for game search
    let searchResults: Game[] = [];
    if (searchQuery) {
      try {
        const response = await searchGames(searchQuery);
        searchResults = response ? response : [];
      } catch (error) {
        console.error("Error searching games:", error);
        searchResults = [];
      }
    }

    // Fetch the current Triple Click Picks
    const tripleClickPicksEntries = kv.list<Game>({ prefix: ["triple-click-picks"] });
    const tripleClickPicks: Game[] = [];
    for await (const entry of tripleClickPicksEntries) {
      tripleClickPicks.push(entry.value);
    }

    // Render the admin page with episodes, search results, and Triple Click Picks
    return ctx.render({ episodes, searchResults, tripleClickPicks });
  },
};

export default function AdminPage({
  data,
}: PageProps<{
  episodes: Episode[];
  searchResults: Game[];
  tripleClickPicks: Game[];
}>) {
  const { episodes, searchResults, tripleClickPicks } = data;

  // Handler functions to add and remove games from Triple Click Picks
  const handleAddToPicks = async (game: Game) => {
    await kv.set(["triple-click-picks", game.id], game);
    location.reload(); // Reload the page to fetch the updated list
  };

  const handleRemoveFromPicks = async (gameId: string) => {
    await kv.delete(["triple-click-picks", gameId]);
    location.reload(); // Reload the page to fetch the updated list
  };

  return (
    <Layout>
      <Head>
        <title>Admin - Triple Click DB</title>
      </Head>

      {/* Episode Management Section */}
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Episode Management</h1>
        <a
          href="/logout"
          class="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        >
          Logout
        </a>
      </div>

      <EpisodeManager episodes={episodes} />

      {/* Triple Click Picks Management Section */}
      <div class="mt-12">
        <h2 class="text-2xl font-semibold mb-4">Manage Triple Click Picks</h2>

        {/* Game Search Form */}
        <form method="get" class="flex mb-6">
          <input
            type="text"
            name="q"
            placeholder="Search for a game..."
            class="border px-4 py-2 rounded-l-md w-full"
          />
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {/* Display Search Results */}
        {searchResults && searchResults.length > 0 ? (
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {searchResults.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                actionButton={{
                  label: "Add to Picks",
                  onClick: () => handleAddToPicks(game),
                }}
              />
            ))}
          </div>
        ) : (
          searchResults.length === 0 && (
            <p>No games found for the current search.</p>
          )
        )}

        {/* Current Triple Click Picks */}
        <h3 class="text-xl font-semibold mb-2">Current Triple Click Picks</h3>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tripleClickPicks.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              actionButton={{
                label: "Remove",
                onClick: () => handleRemoveFromPicks(game.id),
              }}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}


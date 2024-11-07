import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import EpisodeManager from "../../islands/EpisodeManager.tsx";
import { Episode, Game } from "../../types.ts";
import { GameCard } from "../../components/GameCard.tsx";

interface AdminPageData {
  episodes: Episode[];
  searchResults: Game[];
  currentPicks: Game[];
  searchQuery?: string;
}

export const handler: Handlers<AdminPageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q");

    // Fetch all episodes for Episode Management
    const entries = kv.list<Episode>({ prefix: ["episodes"] });
    const episodes: Episode[] = [];
    for await (const entry of entries) {
      episodes.push(entry.value);
    }
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);

    // Initialize search results and current picks
    let searchResults: Game[] = [];
    let currentPicks: Game[] = [];

    // If there's a search query, search through games in KV
    if (searchQuery) {
      const gamesEntries = kv.list<Game>({ prefix: ["games"] });
      for await (const entry of gamesEntries) {
        const game = entry.value;
        if (game.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push(game);
        }
        if (game.isPick) {
          currentPicks.push(game);
        }
      }
    } else {
      // If no search query, just get current picks
      const gamesEntries = kv.list<Game>({ prefix: ["games"] });
      for await (const entry of gamesEntries) {
        if (entry.value.isPick) {
          currentPicks.push(entry.value);
        }
      }
    }

    return ctx.render({
      episodes,
      searchResults,
      currentPicks,
      searchQuery: searchQuery || undefined
    });
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const gameId = form.get("gameId")?.toString();
    const action = form.get("action")?.toString();

    if (!gameId || !action) {
      return new Response("Missing gameId or action", { status: 400 });
    }

    // Get the game from KV
    const gameEntry = await kv.get<Game>(["games", gameId]);
    if (!gameEntry.value) {
      return new Response("Game not found", { status: 404 });
    }

    // Update the game's isPick status
    const updatedGame = {
      ...gameEntry.value,
      isPick: action === "add",
      updatedAt: new Date()
    };

    // Update both KV entries
    await Promise.all([
      kv.set(["games", gameId], updatedGame),
      kv.set(["games_by_igdb", updatedGame.igdbId], updatedGame)
    ]);

    // Redirect back to admin page, preserving search query if it exists
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q");
    const redirectUrl = searchQuery
      ? `/admin?q=${encodeURIComponent(searchQuery)}`
      : "/admin";

    return new Response(null, {
      status: 303,
      headers: { Location: redirectUrl }
    });
  }
};

export default function AdminPage({
  data,
}: PageProps<AdminPageData>) {
  const { episodes, searchResults, currentPicks, searchQuery } = data;

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

      {/* Triple Click Picks Management */}
      <div class="mt-12 space-y-6">
        <h2 class="text-2xl font-bold">Triple Click Picks</h2>

        {/* Search Form */}
        <form method="get" class="flex gap-2">
          <input
            type="text"
            name="q"
            value={searchQuery}
            placeholder="Search for games..."
            class="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h3 class="text-xl font-semibold mb-4">Search Results</h3>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(game => (
                <div key={game.id} class="relative">
                  <GameCard game={game} />
                  <form
                    method="POST"
                    class="absolute top-2 right-2"
                  >
                    <input type="hidden" name="gameId" value={game.id} />
                    <input
                      type="hidden"
                      name="action"
                      value={game.isPick ? "remove" : "add"}
                    />
                    <button
                      type="submit"
                      class={`px-3 py-1 rounded-md text-sm font-medium ${
                        game.isPick
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {game.isPick ? "Remove Pick" : "Add Pick"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Picks */}
        {currentPicks.length > 0 && (
          <div>
            <h3 class="text-xl font-semibold mb-4">Current Picks</h3>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentPicks.map(game => (
                <div key={game.id} class="relative">
                  <GameCard game={game} />
                  <form
                    method="POST"
                    class="absolute top-2 right-2"
                  >
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="action" value="remove" />
                    <button
                      type="submit"
                      class="px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Remove Pick
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

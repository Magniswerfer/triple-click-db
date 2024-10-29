import { Handlers, PageProps } from "$fresh/server.ts"; // routes/games/[game].tsx
/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { kv } from "../../utils/db.ts";

interface Episode {
  id: string;
  title: string;
  date: string;
  description: string;
  games: string[];
  otherMedia: string[];
}

interface GamePageData {
  game: string;
  episodes: Episode[];
}

export const handler: Handlers<GamePageData> = {
  async GET(_req, ctx) {
    const game = decodeURIComponent(ctx.params.game);
    const entries = await kv.list<Episode>({ prefix: ["episodes"] });
    const episodes = [];

    for await (const entry of entries) {
      if (entry.value.games.includes(game)) {
        episodes.push(entry.value);
      }
    }

    return ctx.render({
      game,
      episodes: episodes.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    });
  },
};

export default function GamePage({ data }: PageProps<GamePageData>) {
  const { game, episodes } = data;

  return (
    <>
      <Head>
        <title>{game} - Triple Click Discussions</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-lg">
        <nav class="mb-6">
          <a href="/" class="text-blue-600 hover:underline">
            ← Back to all episodes
          </a>
        </nav>

        <h1 class="text-3xl font-bold mb-6">{game}</h1>
        <p class="mb-6">
          Discussed in {episodes.length} episode
          {episodes.length !== 1 ? "s" : ""}
        </p>

        <div class="space-y-6">
          {episodes.map((episode) => (
            <div key={episode.id} class="border rounded-lg p-4 shadow-sm">
              <h2 class="text-xl font-semibold mb-2">{episode.title}</h2>
              <p class="text-gray-600 mb-2">
                {new Date(episode.date).toLocaleDateString()}
              </p>
              <p class="mb-4">{episode.description}</p>

              <div class="mb-2">
                <h3 class="font-medium mb-1">Other Games Discussed:</h3>
                <div class="flex flex-wrap gap-2">
                  {episode.games
                    .filter((g) =>
                      g !== game
                    )
                    .map((g) => (
                      <a
                        href={`/games/${encodeURIComponent(g)}`}
                        class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm hover:bg-blue-200"
                      >
                        {g}
                      </a>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

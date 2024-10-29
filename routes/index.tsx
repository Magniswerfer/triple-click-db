import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../components/Layout.tsx";
import { EpisodeCard } from "../components/EpisodeCard.tsx";
import { GameCard, MostDiscussedGameCard } from "../components/GameCard.tsx";
import { kv } from "../utils/db.ts";
import { Episode, Game, GameReference } from "../types.ts";

interface HomePageData {
  latestEpisodes: Episode[];
  latestGames: Game[];
  mostDiscussedGames: Array<Game & { mentionCount: number }>;
}

export const handler: Handlers<HomePageData> = {
  async GET(_req, ctx) {
    // Get all episodes
    const episodeEntries = await kv.list<Episode>({ prefix: ["episodes"] });
    const episodes: Episode[] = [];
    for await (const entry of episodeEntries) {
      episodes.push(entry.value);
    }
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
    
    // Get latest episodes
    const latestEpisodes = episodes.slice(0, 3);

    // Track game mentions for both latest and most discussed
    const gameMentions = new Map<string, { 
      game: GameReference; 
      date: string;
      count: number;
    }>();

    // Process all episodes for game mentions
    for (const episode of episodes) {
      if (episode.games) {
        for (const gameRef of episode.games) {
          const existing = gameMentions.get(gameRef.id);
          if (existing) {
            existing.count++;
            if (new Date(episode.date) > new Date(existing.date)) {
              existing.date = episode.date;
            }
          } else {
            gameMentions.set(gameRef.id, { 
              game: gameRef, 
              date: episode.date,
              count: 1
            });
          }
        }
      }
    }

    // Get latest games (by mention date)
    const sortedByDate = Array.from(gameMentions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Get most discussed games (by mention count)
    const sortedByCount = Array.from(gameMentions.values())
      .sort((a, b) => b.count - a.count || new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    // Fetch full game details
    const latestGames: Game[] = [];
    for (const mention of sortedByDate) {
      const gameEntry = await kv.get<Game>(["games", mention.game.id]);
      if (gameEntry.value) {
        latestGames.push(gameEntry.value);
      }
    }

    const mostDiscussedGames: Array<Game & { mentionCount: number }> = [];
    for (const mention of sortedByCount) {
      const gameEntry = await kv.get<Game>(["games", mention.game.id]);
      if (gameEntry.value) {
        mostDiscussedGames.push({
          ...gameEntry.value,
          mentionCount: mention.count
        });
      }
    }

    return ctx.render({ latestEpisodes, latestGames, mostDiscussedGames });
  }
};

function Home({ data }: PageProps<HomePageData>) {
  const { latestEpisodes, latestGames, mostDiscussedGames } = data;

  return (
    <Layout>
      <Head>
        <title>Triple Click DB</title>
      </Head>

      <div class="space-y-12">
        {/* Latest Episodes */}
        <section>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Latest Episodes</h2>
            <a
              href="/episodes"
              class="text-blue-600 hover:underline"
            >
              View all episodes →
            </a>
          </div>

          <div class="space-y-6">
            {latestEpisodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        </section>

        {/* Most Discussed Games */}
        <section>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Most Discussed Games</h2>
            <a
              href="/games"
              class="text-blue-600 hover:underline"
            >
              View all games →
            </a>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            {mostDiscussedGames.map((game) => (
              <MostDiscussedGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Recently Discussed Games */}
        <section>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Recently Discussed Games</h2>
            <a
              href="/games"
              class="text-blue-600 hover:underline"
            >
              View all games →
            </a>
          </div>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;

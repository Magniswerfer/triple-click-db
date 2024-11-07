import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../components/Layout.tsx";
import { EpisodeCard } from "../components/EpisodeCard.tsx";
import { GameCard, MostDiscussedGameCard } from "../components/GameCard.tsx";
import { kv } from "../utils/db.ts";
import { Episode, Game, GameReference } from "../types.ts";

// Cache interface
interface CacheData {
  data: HomePageData;
  timestamp: number;
}

interface HomePageData {
  latestEpisodes: Episode[];
  latestGames: Game[];
  mostDiscussedGames: Array<Game & { mentionCount: number }>;
  tripleClickPicks: Game[];
}

const CACHE_DURATION = 5 * 60 * 1000;
const pageCache = new Map<string, CacheData>();

// Helper function to fetch Triple Click Picks using isPick flag
async function fetchTripleClickPicks(): Promise<Game[]> {
  const picks: Game[] = [];
  const gamesEntries = kv.list<Game>({ prefix: ["games"] });

  for await (const entry of gamesEntries) {
    if (entry.value.isPick) {
      picks.push(entry.value);
    }
  }

  // Sort by title alphabetically
  return picks.sort((a, b) => a.title.localeCompare(b.title));
}

export const handler: Handlers<HomePageData> = {
  async GET(_req, ctx) {
    const cached = pageCache.get("home");
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return ctx.render(cached.data);
    }

    const episodes = await fetchEpisodes();
    const { latestGames, mostDiscussedGames } = await fetchGamesByMentions(episodes);
    const tripleClickPicks = await fetchTripleClickPicks();

    const data = {
      latestEpisodes: episodes.slice(0, 3),
      latestGames,
      mostDiscussedGames,
      tripleClickPicks,
    };

    pageCache.set("home", { data, timestamp: Date.now() });
    return ctx.render(data);
  },
};

// Your existing helper functions...
async function fetchEpisodes(): Promise<Episode[]> {
  const entries = kv.list<Episode>({ prefix: ["episodes"] });
  const episodes: Episode[] = [];
  for await (const entry of entries) {
    episodes.push(entry.value);
  }
  return episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
}

async function fetchGamesByMentions(episodes: Episode[]) {
  const gameMentions = new Map<
    string,
    { game: GameReference; date: string; count: number }
  >();

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
          gameMentions.set(gameRef.id, { game: gameRef, date: episode.date, count: 1 });
        }
      }
    }
  }

  const sortedByDate = Array.from(gameMentions.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const sortedByCount = Array.from(gameMentions.values())
    .sort((a, b) => b.count - a.count || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const gamePromises = [...new Set([...sortedByDate, ...sortedByCount])].map(
    (mention) => kv.get<Game>(["games", mention.game.id])
  );
  const gameResults = await Promise.all(gamePromises);
  const gameMap = new Map(gameResults.filter((result) => result.value).map((result) => [result.value!.id, result.value!]));

  return {
    latestGames: sortedByDate.map((mention) => gameMap.get(mention.game.id)).filter((game): game is Game => !!game),
    mostDiscussedGames: sortedByCount.map((mention) => {
      const game = gameMap.get(mention.game.id);
      return game ? { ...game, mentionCount: mention.count } : null;
    }).filter((game): game is Game & { mentionCount: number } => !!game),
  };
}

function Home({ data }: PageProps<HomePageData>) {
  const { latestEpisodes, latestGames, mostDiscussedGames, tripleClickPicks } = data;

  return (
    <Layout>
      <Head>
        <title>Triple Click DB</title>
      </Head>

      {/* Recently Discussed Games */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Recently Discussed Games</h2>
          <a href="/games" class="text-secondary-400 hover:underline">
            View all games →
          </a>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {latestGames.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      </section>



      {/* Latest Episodes */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Latest Episodes</h2>
          <a href="/episodes" class="text-secondary-400 hover:underline">
            View all episodes →
          </a>
        </div>

        <div class="space-y-6 mb-12">
          {latestEpisodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </section>

      {/* Most Discussed Games */}
      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Most Discussed Games</h2>
          <a href="/games" class="text-secondary-400 hover:underline">
            View all games →
          </a>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          {mostDiscussedGames.map((game) => (
            <MostDiscussedGameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Triple Click Picks */}
            {tripleClickPicks.length > 0 && (
              <section>
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold">Triple Click Picks</h2>
                </div>

                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  {tripleClickPicks.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                    />
                  ))}
                </div>
              </section>
            )}
    </Layout>
  );
}

export default Home;

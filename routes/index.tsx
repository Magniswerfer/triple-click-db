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
}

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const pageCache = new Map<string, CacheData>();

export const handler: Handlers<HomePageData> = {
  async GET(_req, ctx) {
    // Check cache first
    const cached = pageCache.get('home');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return ctx.render(cached.data);
    }

    // Get all episodes in one batch
    const episodeEntries = kv.list<Episode>({ prefix: ["episodes"] });
    const episodes: Episode[] = [];
    const gameMentions = new Map<string, { 
      game: GameReference; 
      date: string;
      count: number;
    }>();

    // Process episodes as they come in
    for await (const entry of episodeEntries) {
      episodes.push(entry.value);
      
      if (entry.value.games) {
        for (const gameRef of entry.value.games) {
          const existing = gameMentions.get(gameRef.id);
          if (existing) {
            existing.count++;
            if (new Date(entry.value.date) > new Date(existing.date)) {
              existing.date = entry.value.date;
            }
          } else {
            gameMentions.set(gameRef.id, { 
              game: gameRef, 
              date: entry.value.date,
              count: 1
            });
          }
        }
      }
    }

    // Sort episodes once
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
    const latestEpisodes = episodes.slice(0, 3);

    // Process game mentions
    const sortedByDate = Array.from(gameMentions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const sortedByCount = Array.from(gameMentions.values())
      .sort((a, b) => b.count - a.count || new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    // Fetch all game details concurrently
    const gamePromises = [...new Set([...sortedByDate, ...sortedByCount])]
      .map(mention => kv.get<Game>(["games", mention.game.id]));
    
    const gameResults = await Promise.all(gamePromises);
    const gameMap = new Map(
      gameResults
        .filter(result => result.value)
        .map(result => [result.value.id, result.value])
    );

    // Construct latest games list
    const latestGames = sortedByDate
      .map(mention => gameMap.get(mention.game.id))
      .filter((game): game is Game => !!game);

    // Construct most discussed games list
    const mostDiscussedGames = sortedByCount
      .map(mention => {
        const game = gameMap.get(mention.game.id);
        return game ? { ...game, mentionCount: mention.count } : null;
      })
      .filter((game): game is Game & { mentionCount: number } => !!game);

    const data = { latestEpisodes, latestGames, mostDiscussedGames };
    
    // Update cache
    pageCache.set('home', {
      data,
      timestamp: Date.now()
    });

    return ctx.render(data);
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
              class="text-secondary-400 hover:underline"
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
              class="text-secondary-400 hover:underline"
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
              class="text-secondary-400 hover:underline"
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

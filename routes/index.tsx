import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../components/Layout.tsx";
import { EpisodeCard } from "../components/EpisodeCard.tsx";
import { GameCard, MostDiscussedGameCard } from "../components/GameCard.tsx";
import { kv, withCache, batchGetGames } from "../utils/db.ts";
import { Episode, Game, GameReference } from "../types.ts";
import HeroSection from "../islands/HeroSection.tsx"

interface HomePageData {
  latestEpisodes: Episode[];
  latestGames: Game[];
  mostDiscussedGames: Array<Game & { mentionCount: number }>;
  tripleClickPicks: Game[];
}

async function fetchAllEpisodes(): Promise<Episode[]> {
  const episodes: Episode[] = [];
  const entriesIter = kv.list<Episode>({ prefix: ["episodes"] });
  for await (const entry of entriesIter) {
    episodes.push(entry.value);
  }
  return episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
}

async function fetchTripleClickPicks(): Promise<Game[]> {
  const picks: Game[] = [];
  const gamesEntries = kv.list<Game>({ prefix: ["games"] });

  for await (const entry of gamesEntries) {
    if (entry.value.isPick) {
      picks.push(entry.value);
    }
  }

  return picks.sort((a, b) => a.title.localeCompare(b.title));
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
          gameMentions.set(gameRef.id, {
            game: gameRef,
            date: episode.date,
            count: 1
          });
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

  const gameIds = [...new Set([
    ...sortedByDate.map(m => m.game.id),
    ...sortedByCount.map(m => m.game.id)
  ])];

  const gameMap = await batchGetGames(gameIds);

  return {
    latestGames: sortedByDate
      .map((mention) => gameMap.get(mention.game.id))
      .filter((game): game is Game => !!game),
    mostDiscussedGames: sortedByCount
      .map((mention) => {
        const game = gameMap.get(mention.game.id);
        return game ? { ...game, mentionCount: mention.count } : null;
      })
      .filter((game): game is Game & { mentionCount: number } => !!game),
  };
}

export const handler: Handlers<HomePageData> = {
  async GET(_req, ctx) {
    // Force async state with a minimal delay
    await new Promise(resolve => setTimeout(resolve, 0));

    const data = await withCache("home", async () => {
      const [episodes, tripleClickPicks] = await Promise.all([
        fetchAllEpisodes(),
        fetchTripleClickPicks()
      ]);

      const { latestGames, mostDiscussedGames } = await fetchGamesByMentions(episodes);

      return {
        latestEpisodes: episodes.slice(0, 3),
        latestGames,
        mostDiscussedGames,
        tripleClickPicks,
      };
    });

    return ctx.render(data);
  },
};

// Rest of the component remains the same...

export default function Home({ data }: PageProps<HomePageData>) {
  const { latestEpisodes, latestGames, mostDiscussedGames, tripleClickPicks } = data;

  return (
    <Layout>
      <Head>
        <title>Triple Click Dex</title>
      </Head>
      <HeroSection />
      {/* Recently Discussed Games */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Recently Discussed Games</h2>
          <a href="/games" class="text-secondary-400 hover:underline">
            View all games →
          </a>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {latestGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
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

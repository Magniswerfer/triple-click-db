import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import { Episode, Game, GameReference } from "../../types.ts";
import { GameCard } from "../../components/GameCard.tsx";

interface GameWithMentions extends Game {
  episodeCount: number;
  lastMentioned: string;
}

interface GamesPageData {
  games: GameWithMentions[];
  totalEpisodes: number;
}

export const handler: Handlers<GamesPageData> = {
  async GET(_req, ctx) {
    const entries = await kv.list<Episode>({ prefix: ["episodes"] });
    const gameReferenceMap = new Map<string, { count: number; lastMentioned: string }>();
    let totalEpisodes = 0;

    // First pass: collect all game references and their mention counts
    for await (const entry of entries) {
      totalEpisodes++;
      const episode = entry.value;
      
      if (episode.games && Array.isArray(episode.games)) {
        for (const gameRef of episode.games) {
          const existingRef = gameReferenceMap.get(gameRef.id);
          if (existingRef) {
            existingRef.count++;
            if (new Date(episode.date) > new Date(existingRef.lastMentioned)) {
              existingRef.lastMentioned = episode.date;
            }
          } else {
            gameReferenceMap.set(gameRef.id, {
              count: 1,
              lastMentioned: episode.date,
            });
          }
        }
      }
    }

    // Second pass: get full game details and combine with mention data
    const games: GameWithMentions[] = [];
    for (const [gameId, mentions] of gameReferenceMap.entries()) {
      const gameEntry = await kv.get<Game>(["games", gameId]);
      if (gameEntry.value) {
        games.push({
          ...gameEntry.value,
          episodeCount: mentions.count,
          lastMentioned: mentions.lastMentioned,
        });
      }
    }

    // Sort by most recently mentioned
    games.sort((a, b) => 
      new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime()
    );

    return ctx.render({ games, totalEpisodes });
  },
};


export default function GamesPage({ data }: PageProps<GamesPageData>) {
  const { games, totalEpisodes } = data;

  return (
    <Layout>
      <Head>
        <title>Games Discussed - Triple Click</title>
      </Head>
      
      <h1 class="text-3xl font-bold mb-6">Games Discussed</h1>
      
      {games.length === 0 ? (
        <div class="text-center py-12">
          <div class="text-gray-500 mb-4">
            No games have been discussed yet.
          </div>
          <div class="text-sm text-gray-400">
            {totalEpisodes === 0 
              ? "No episodes have been processed yet."
              : `${totalEpisodes} episodes have been processed, but no games were found.`
            }
          </div>
        </div>
      ) : (
        <>
          <p class="mb-6">
            {games.length} games discussed across {totalEpisodes} episodes
          </p>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard 
                key={game.id} 
                game={game}
                mentionCount={game.episodeCount}
              />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

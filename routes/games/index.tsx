import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import { Episode, Game, GameReference } from "../../types.ts";
import { GameCard, GameCardSkeleton } from "../../components/GameCard.tsx";
import PaginationIsland from "../../islands/PaginationIsland.tsx";

const ITEMS_PER_PAGE = 27;
const CACHE_DURATION = 5 * 60 * 1000;

interface GameWithMentions extends Game {
  episodeCount: number;
  lastMentioned: string;
}

interface GamesPageData {
  games: {
    items: GameWithMentions[];
    currentPage: number;
    totalPages: number;
    total: number;
  };
  totalEpisodes: number;
}

// In-memory cache
const gamesCache = new Map<string, {
  data: {
    games: GameWithMentions[];
    totalEpisodes: number;
  };
  timestamp: number;
}>();

async function getGamesData() {
  // Check cache first
  const cached = gamesCache.get("all_games");
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const episodeEntries = kv.list<Episode>({ prefix: ["episodes"] });
  const gameReferenceMap = new Map<string, {
    count: number;
    lastMentioned: string;
    gameRef: GameReference;
  }>();
  let totalEpisodes = 0;

  for await (const entry of episodeEntries) {
    totalEpisodes++;
    const episode = entry.value;

    if (episode.games?.length) {
      for (const gameRef of episode.games) {
        const existing = gameReferenceMap.get(gameRef.id);
        if (existing) {
          existing.count++;
          if (new Date(episode.date) > new Date(existing.lastMentioned)) {
            existing.lastMentioned = episode.date;
          }
        } else {
          gameReferenceMap.set(gameRef.id, {
            count: 1,
            lastMentioned: episode.date,
            gameRef,
          });
        }
      }
    }
  }

  const gameResults = await Promise.all(
    Array.from(gameReferenceMap.entries()).map(([gameId, data]) =>
      kv.get<Game>(["games", gameId]).then((entry) => ({
        gameId,
        game: entry.value,
        mentions: data,
      }))
    )
  );

  const games = gameResults
    .filter((result) => result.game)
    .map(({ game, mentions }) => ({
      ...game!,
      episodeCount: mentions.count,
      lastMentioned: mentions.lastMentioned,
    }))
    .sort((a, b) =>
      new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime()
    );

  const data = { games, totalEpisodes };
  gamesCache.set("all_games", { data, timestamp: Date.now() });
  return data;
}


export const handler: Handlers<GamesPageData> = {
  async GET(req, ctx) {
    try {
      // Force async state with a minimal delay
      await new Promise(resolve => setTimeout(resolve, 0));

      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("gamePage") || "1");
      const { games: allGames, totalEpisodes } = await getGamesData();

      const total = allGames.length;
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const currentPage = Math.min(Math.max(1, page), totalPages || 1);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedGames = allGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      return ctx.render({
        games: {
          items: paginatedGames,
          currentPage,
          totalPages,
          total,
        },
        totalEpisodes,
      });
    } catch (error) {
      console.error("Error in games handler:", error);
      return ctx.render({
        games: { items: [], currentPage: 1, totalPages: 0, total: 0 },
        totalEpisodes: 0,
      });
    }
  },
};

function GamesContent({ games, totalEpisodes }: GamesPageData) {
  if (!games?.total) {
    return (
      <div class="text-center py-12">
        <div class="text-gray-500 mb-4">
          No games have been discussed yet.
        </div>
        <div class="text-sm text-gray-400">
          {totalEpisodes === 0
            ? "No episodes have been processed yet."
            : `${totalEpisodes} episodes have been processed, but no games were found.`}
        </div>
      </div>
    );
  }

  return (
    <>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.items.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            mentionCount={game.episodeCount}
          />
        ))}
      </div>

      <PaginationIsland
        currentPage={games.currentPage}
        totalPages={games.totalPages}
        searchQuery=""
        paramName="gamePage"
      />
    </>
  );
}

export default function GamesPage({ data }: PageProps<GamesPageData>) {
  return (
    <Layout>
      <Head>
        <title>Games Discussed - Triple Click</title>
      </Head>

      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-4" data-section="gamePage">
          Games Discussed
        </h1>
        <div class="h-6">
          {data.games?.total > 0 && (
            <p>
              {data.games.total} games discussed across {data.totalEpisodes} episodes
            </p>
          )}
        </div>
      </div>

      <div id="games-content">
        <GamesContent {...data} />
      </div>
    </Layout>
  );
}

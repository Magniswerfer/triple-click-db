// routes/games/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import { Episode, Game, GameReference } from "../../types.ts";
import { GameCard } from "../../components/GameCard.tsx";
import SearchBarIsland from "../../islands/SearchBarIsland.tsx";
import { SearchStatus } from "../../components/SearchStatus.tsx";
import { Pagination } from "../../components/Pagination.tsx";
import { filterGames } from "../../utils/search.ts";

const ITEMS_PER_PAGE = 27;

interface GameWithMentions extends Game {
  episodeCount: number;
  lastMentioned: string;
}

interface GamesPageData {
  games: GameWithMentions[];
  totalEpisodes: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  totalResults: number;
}

export const handler: Handlers<GamesPageData> = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const searchQuery = url.searchParams.get("search") || "";

      // Collect episode data and game references
      const entries = await kv.list<Episode>({ prefix: ["episodes"] });
      const gameReferenceMap = new Map<string, { count: number; lastMentioned: string }>();
      let totalEpisodes = 0;

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

      // Get full game details and combine with mention data
      let allGames: GameWithMentions[] = [];
      for (const [gameId, mentions] of gameReferenceMap.entries()) {
        const gameEntry = await kv.get<Game>(["games", gameId]);
        if (gameEntry.value) {
          allGames.push({
            ...gameEntry.value,
            episodeCount: mentions.count,
            lastMentioned: mentions.lastMentioned,
          });
        }
      }

      // Sort by most recently mentioned
      allGames.sort((a, b) => 
        new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime()
      );

      // Apply search filter
      const filteredGames = filterGames(allGames, searchQuery);
      const totalResults = filteredGames.length;
      const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
      const currentPage = Math.min(Math.max(1, page), totalPages || 1);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const games = filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      return ctx.render({ 
        games, 
        totalEpisodes, 
        currentPage, 
        totalPages, 
        searchQuery,
        totalResults
      });
    } catch (error) {
      console.error("Error in games handler:", error);
      return ctx.render({ 
        games: [], 
        totalEpisodes: 0, 
        currentPage: 1, 
        totalPages: 0, 
        searchQuery: "",
        totalResults: 0
      });
    }
  },
};

export default function GamesPage({ data }: PageProps<GamesPageData>) {
  const { 
    games, 
    totalEpisodes, 
    currentPage, 
    totalPages, 
    searchQuery,
    totalResults 
  } = data;

  return (
    <Layout>
      <Head>
        <title>Games Discussed - Triple Click</title>
      </Head>
      
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-4">Games Discussed</h1>

        <SearchBarIsland 
          initialQuery={searchQuery}
          placeholder="Search games by title"
        />

        <SearchStatus 
          totalResults={totalResults}
          searchQuery={searchQuery}
          itemName="game"
        />
      </div>

      {games.length === 0 && !searchQuery ? (
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
          {!searchQuery && (
            <p class="mb-6">
              {totalResults} games discussed across {totalEpisodes} episodes
            </p>
          )}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
      />
    </Layout>
  );
}

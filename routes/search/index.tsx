import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Episode, Game } from "../../types.ts";
import { kv } from "../../utils/db.ts";
import { filterEpisodes, filterGames } from "../../utils/search.ts";
import Layout from "../../components/Layout.tsx";
import { EpisodeCard } from "../../components/EpisodeCard.tsx";
import { GameCard } from "../../components/GameCard.tsx";
import PaginationIsland from "../../islands/PaginationIsland.tsx";
import RecommendationCard from "../../islands/RecommendationCard.tsx";

const ITEMS_PER_PAGE = 10;

interface SearchResults {
  query: string;
  episodes: {
    items: Episode[];
    currentPage: number;
    totalPages: number;
    total: number;
  };
  games: {
    items: Game[];
    currentPage: number;
    totalPages: number;
    total: number;
  };
  oneMoreThings: {
    items: Array<{
      content: string;
      category: string;
      episode: {
        id: string;
        title: string;
        episodeNumber: number;
      };
      person: string;
    }>;
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

// Helper function to safely get pagination parameters
function getPaginationParams(url: URL) {
  return {
    query: url.searchParams.get("q") || "",
    episodePage: Math.max(
      1,
      parseInt(url.searchParams.get("episodePage") || "1"),
    ),
    gamePage: Math.max(1, parseInt(url.searchParams.get("gamePage") || "1")),
    omtPage: Math.max(1, parseInt(url.searchParams.get("omtPage") || "1")),
  };
}

// Helper function to paginate arrays
function paginateArray<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number,
): {
  paginatedItems: T[];
  totalPages: number;
  actualPage: number;
} {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);

  return {
    paginatedItems: items.slice(startIndex, endIndex),
    totalPages,
    actualPage: validPage,
  };
}

export const handler: Handlers<SearchResults> = {
  async GET(req, ctx) {
    const { query, episodePage, gamePage, omtPage } = getPaginationParams(
      new URL(req.url),
    );

    // Return empty results if no query
    if (!query) {
      return ctx.render({
        query,
        episodes: { items: [], currentPage: 1, totalPages: 0, total: 0 },
        games: { items: [], currentPage: 1, totalPages: 0, total: 0 },
        oneMoreThings: { items: [], currentPage: 1, totalPages: 0, total: 0 },
      });
    }

    try {
      // Fetch and sort all content
      const allEpisodes: Episode[] = [];
      const allGames: Game[] = [];

      // Fetch episodes
      const episodeIter = kv.list<Episode>({ prefix: ["episodes"] });
      for await (const entry of episodeIter) {
        allEpisodes.push(entry.value);
      }
      // Ensure consistent ordering
      allEpisodes.sort((a, b) => b.episodeNumber - a.episodeNumber);

      // Fetch games
      const gameIter = kv.list<Game>({ prefix: ["games"] });
      for await (const entry of gameIter) {
        allGames.push(entry.value);
      }
      // Ensure consistent ordering
      allGames.sort((a, b) => a.title.localeCompare(b.title));

      // Filter and paginate episodes
      const matchedEpisodes = filterEpisodes(allEpisodes, query);
      console.log(
        `Found ${matchedEpisodes.length} matching episodes for query: "${query}"`,
      );
      const {
        paginatedItems: paginatedEpisodes,
        totalPages: episodeTotalPages,
        actualPage: validEpisodePage,
      } = paginateArray(matchedEpisodes, episodePage, ITEMS_PER_PAGE);

      // Filter and paginate games
      const matchedGames = filterGames(allGames, query);
      console.log(
        `Found ${matchedGames.length} matching games for query: "${query}"`,
      );
      const {
        paginatedItems: paginatedGames,
        totalPages: gameTotalPages,
        actualPage: validGamePage,
      } = paginateArray(matchedGames, gamePage, ITEMS_PER_PAGE);

      // Process and paginate One More Thing entries
      const allOneMoreThings = allEpisodes.flatMap((episode) => {
        const entries = [];
        const omt = episode.sections.oneMoreThing;
        const lowerQuery = query.toLowerCase();

        ["kirk", "maddy", "jason"].forEach((person) => {
          if (omt[person].content.toLowerCase().includes(lowerQuery)) {
            entries.push({
              content: omt[person].content,
              category: omt[person].category,
              episode: {
                id: episode.id,
                title: episode.title,
                episodeNumber: episode.episodeNumber,
                date: episode.date, // Add date here
              },
              person: person.charAt(0).toUpperCase() + person.slice(1),
            });
          }
        });

        return entries;
      });
      const {
        paginatedItems: paginatedOMT,
        totalPages: omtTotalPages,
        actualPage: validOmtPage,
      } = paginateArray(allOneMoreThings, omtPage, ITEMS_PER_PAGE);

      // Log pagination details for debugging
      console.log({
        episodes: {
          total: matchedEpisodes.length,
          page: validEpisodePage,
          totalPages: episodeTotalPages,
          itemsOnPage: paginatedEpisodes.length,
        },
        games: {
          total: matchedGames.length,
          page: validGamePage,
          totalPages: gameTotalPages,
          itemsOnPage: paginatedGames.length,
        },
        oneMoreThings: {
          total: allOneMoreThings.length,
          page: validOmtPage,
          totalPages: omtTotalPages,
          itemsOnPage: paginatedOMT.length,
        },
      });

      return ctx.render({
        query,
        episodes: {
          items: paginatedEpisodes,
          currentPage: validEpisodePage,
          totalPages: episodeTotalPages,
          total: matchedEpisodes.length,
        },
        games: {
          items: paginatedGames,
          currentPage: validGamePage,
          totalPages: gameTotalPages,
          total: matchedGames.length,
        },
        oneMoreThings: {
          items: paginatedOMT,
          currentPage: validOmtPage,
          totalPages: omtTotalPages,
          total: allOneMoreThings.length,
        },
      });
    } catch (error) {
      console.error("Search error:", error);
      return ctx.render({
        query,
        episodes: { items: [], currentPage: 1, totalPages: 0, total: 0 },
        games: { items: [], currentPage: 1, totalPages: 0, total: 0 },
        oneMoreThings: { items: [], currentPage: 1, totalPages: 0, total: 0 },
      });
    }
  },
};

export default function SearchPage({ data }: PageProps<SearchResults>) {
  const { query, episodes, games, oneMoreThings } = data;
  const hasResults = episodes.total > 0 || games.total > 0 ||
    oneMoreThings.total > 0;

  return (
    <Layout>
      <Head>
        <title>Search Results - Triple Click Dex</title>
      </Head>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold mb-4">Search Results for "{query}"</h1>

        {!hasResults && (
          <div class="bg-light-100 rounded-lg p-6 text-center">
            <p class="text-lg text-gray-600">
              No results found for your search.
            </p>
            <p class="mt-2 text-gray-500">
              Try searching for something else or browse our{" "}
              <a href="/episodes" class="text-primary-500 hover:underline">
                episodes
              </a>
              ,{" "}
              <a href="/games" class="text-primary-500 hover:underline">
                games
              </a>
              , or{" "}
              <a
                href="/one-more-thing"
                class="text-primary-500 hover:underline"
              >
                One More Thing
              </a>{" "}
              sections.
            </p>
          </div>
        )}

        {episodes.total > 0 && (
          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4" data-section="episodePage">
              Episodes ({episodes.total} found)
            </h2>
            <div class="space-y-4 content">
              {" "}
              {/* Added content class */}
              {episodes.items.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  showFullContent={false}
                />
              ))}
            </div>
            <PaginationIsland
              currentPage={episodes.currentPage}
              totalPages={episodes.totalPages}
              searchQuery={query}
              paramName="episodePage"
            />
          </section>
        )}
        {games.total > 0 && (
          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4" data-section="gamePage">
              Games ({games.total} found)
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.items.map((game) => (
                <GameCard key={game.id} game={game} showGenres={true} />
              ))}
            </div>
            <PaginationIsland
              currentPage={games.currentPage}
              totalPages={games.totalPages}
              searchQuery={query}
              paramName="gamePage"
            />
          </section>
        )}

        {oneMoreThings.total > 0 && (
          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4" data-section="omtPage">
              One More Thing ({oneMoreThings.total} found)
            </h2>
            <div class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {oneMoreThings.items.map((entry, index) => (
                <RecommendationCard
                  key={`${entry.episode.id}-${entry.person}-${index}`}
                  id={entry.episode.id}
                  episodeNumber={entry.episode.episodeNumber}
                  episodeTitle={entry.episode.title}
                  date={entry.episode.date} // Pass date
                  host={entry.person.toLowerCase()}
                  content={entry.content}
                  category={entry.category as OneMoreThingCategory}
                />
              ))}
            </div>
            <PaginationIsland
              currentPage={oneMoreThings.currentPage}
              totalPages={oneMoreThings.totalPages}
              searchQuery={query}
              paramName="omtPage"
            />
          </section>
        )}
      </div>
    </Layout>
  );
}

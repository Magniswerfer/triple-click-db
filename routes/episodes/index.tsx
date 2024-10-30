// Updated routes/episodes/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { EpisodeCard } from "../../components/EpisodeCard.tsx";
import SearchBarIsland from "../../islands/SearchBarIsland.tsx";
import { SearchStatus } from "../../components/SearchStatus.tsx";
import { Pagination } from "../../components/Pagination.tsx";
import { kv } from "../../utils/db.ts";
import { Episode } from "../../types.ts";
import { filterEpisodes } from "../../utils/search.ts";


const ITEMS_PER_PAGE = 10;

export const handler: Handlers<{
  episodes: Episode[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  totalResults: number; // Add this
}> = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const searchQuery = url.searchParams.get("search") || "";

      const entries = await kv.list<Episode>({ prefix: ["episodes"] });
      const allEpisodes: Episode[] = [];

      for await (const entry of entries) {
        if (entry && entry.value) {
          allEpisodes.push(entry.value);
        }
      }

      allEpisodes.sort((a, b) => {
        const numA = a?.episodeNumber ?? 0;
        const numB = b?.episodeNumber ?? 0;
        return numB - numA;
      });

      const filteredEpisodes = filterEpisodes(allEpisodes, searchQuery);
      const totalResults = filteredEpisodes.length; // Store total filtered results
      const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
      const currentPage = Math.min(Math.max(1, page), totalPages || 1);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const episodes = filteredEpisodes.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
      );

      return ctx.render({
        episodes,
        currentPage,
        totalPages,
        searchQuery,
        totalResults, // Pass to the component
      });
    } catch (error) {
      console.error("Error in episodes handler:", error);
      return ctx.render({
        episodes: [],
        currentPage: 1,
        totalPages: 0,
        searchQuery: "",
        totalResults: 0,
      });
    }
  },
};

export default function EpisodesPage({ data }: PageProps<{
  episodes: Episode[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  totalResults: number;
}>) {
  const { episodes, currentPage, totalPages, searchQuery, totalResults } = data;

  return (
    <Layout>
      <Head>
        <title>Episodes - Triple Click</title>
      </Head>
      
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-3xl font-bold">All Episodes</h1>
        </div>

        <SearchBarIsland 
          initialQuery={searchQuery}
          placeholder="Search episodes, games, and discussions..."
        />

        <SearchStatus 
          totalResults={totalResults}
          searchQuery={searchQuery}
          itemName="episode"
        />
      </div>

      {/* Episodes List */}
      <div class="space-y-6">
        {episodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
      />
    </Layout>
  );
}

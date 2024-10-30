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
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface EpisodesPageData {
  episodes: Episode[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  totalResults: number;
}

interface CacheEntry {
  episodes: Episode[];
  timestamp: number;
}

// In-memory cache
const episodesCache = new Map<string, CacheEntry>();

async function getAllEpisodes(): Promise<Episode[]> {
  // Check cache first
  const cached = episodesCache.get('all_episodes');
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.episodes;
  }

  // If not cached, fetch and process episodes
  const entries = kv.list<Episode>({ prefix: ["episodes"] });
  const episodes: Episode[] = [];
  
  for await (const entry of entries) {
    if (entry?.value) {
      episodes.push(entry.value);
    }
  }

  // Sort once and cache
  episodes.sort((a, b) => {
    const numA = a?.episodeNumber ?? 0;
    const numB = b?.episodeNumber ?? 0;
    return numB - numA;
  });

  // Update cache
  episodesCache.set('all_episodes', {
    episodes,
    timestamp: Date.now()
  });

  return episodes;
}

export const handler: Handlers<EpisodesPageData> = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const searchQuery = url.searchParams.get("search") || "";
      
      // Get episodes (from cache if available)
      const allEpisodes = await getAllEpisodes();

      // Apply search filter
      const filteredEpisodes = filterEpisodes(allEpisodes, searchQuery);
      const totalResults = filteredEpisodes.length;
      const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
      
      // Calculate pagination
      const page = parseInt(url.searchParams.get("page") || "1");
      const currentPage = Math.min(Math.max(1, page), totalPages || 1);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const episodes = filteredEpisodes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      return ctx.render({
        episodes,
        currentPage,
        totalPages,
        searchQuery,
        totalResults,
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

// Cache management utilities
export const episodesCacheUtils = {
  // Invalidate cache when new episodes are added
  invalidateCache() {
    episodesCache.clear();
  },

  // Warm cache on server start
  async warmCache() {
    try {
      await getAllEpisodes();
    } catch (error) {
      console.error("Error warming episodes cache:", error);
    }
  },

  // Update cache with new episode
  async updateCacheWithEpisode(episode: Episode) {
    const cached = episodesCache.get('all_episodes');
    if (cached) {
      const episodes = [...cached.episodes];
      const existingIndex = episodes.findIndex(ep => ep.id === episode.id);
      
      if (existingIndex >= 0) {
        episodes[existingIndex] = episode;
      } else {
        episodes.push(episode);
      }

      episodes.sort((a, b) => {
        const numA = a?.episodeNumber ?? 0;
        const numB = b?.episodeNumber ?? 0;
        return numB - numA;
      });

      episodesCache.set('all_episodes', {
        episodes,
        timestamp: Date.now()
      });
    }
  }
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

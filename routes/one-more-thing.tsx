import { Handlers, PageProps } from "$fresh/server.ts";
import EpisodeFilter from "../islands/EpisodeFilter.tsx";
import Layout from "../components/Layout.tsx";
import SearchBar from "../components/SearchBar.tsx";
import { kv } from "../utils/db.ts";

type OneMoreThingCategory =
  | "Game"
  | "Book"
  | "TV-Show"
  | "Movie"
  | "Podcast"
  | "Misc";

interface OneMoreThingEntry {
  content: string;
  category: OneMoreThingCategory;
}

interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  date: string;
  sections: {
    oneMoreThing: {
      kirk: OneMoreThingEntry;
      maddy: OneMoreThingEntry;
      jason: OneMoreThingEntry;
    };
  };
}

interface PageData {
  episodes: Episode[];
  host: string;
  category: string;
  searchQuery: string;
  currentPage: number;
}

interface CacheEntry {
  episodes: Episode[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache for episodes with recommendations
const recommendationsCache = new Map<string, CacheEntry>();

// Pre-process episode to extract recommendation data
function processEpisodeRecommendations(episode: Episode) {
  const recommendations = {
    kirk: episode.sections.oneMoreThing.kirk,
    maddy: episode.sections.oneMoreThing.maddy,
    jason: episode.sections.oneMoreThing.jason,
  };

  const hasRecommendations = Object.values(recommendations).some(rec => rec.content);
  if (!hasRecommendations) return null;

  const categories = new Set<string>();
  Object.values(recommendations).forEach(rec => {
    if (rec.content && rec.category) {
      categories.add(rec.category);
    }
  });

  return {
    ...episode,
    _metadata: {
      categories: Array.from(categories),
      hosts: Object.entries(recommendations)
        .filter(([, rec]) => rec.content)
        .map(([host]) => host),
    },
  };
}

async function getRecommendationsData(): Promise<Episode[]> {
  // Check cache first
  const cached = recommendationsCache.get('all_recommendations');
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.episodes;
  }

  // Fetch and process episodes
  const episodeEntries = kv.list<Episode>({ prefix: ["episodes"] });
  const processedEpisodes: Episode[] = [];

  for await (const entry of episodeEntries) {
    const processed = processEpisodeRecommendations(entry.value);
    if (processed) {
      processedEpisodes.push(processed);
    }
  }

  // Sort by date
  processedEpisodes.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Update cache
  recommendationsCache.set('all_recommendations', {
    episodes: processedEpisodes,
    timestamp: Date.now()
  });

  return processedEpisodes;
}

function searchEpisodes(episodes: Episode[], searchQuery: string): Episode[] {
  if (!searchQuery) return episodes;
  
  const query = searchQuery.toLowerCase();
  return episodes.filter((episode) => {
    if (episode.title.toLowerCase().includes(query)) return true;
    if (episode.episodeNumber.toString().includes(query)) return true;
    return Object.values(episode.sections.oneMoreThing).some(
      (rec) => rec.content && rec.content.toLowerCase().includes(query),
    );
  });
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const searchQuery = url.searchParams.get("search") || "";
      const host = url.searchParams.get("host") || "all";
      const category = url.searchParams.get("category") || "all";
      const currentPage = parseInt(url.searchParams.get("page") || "1");

      // Get episodes with recommendations
      const episodes = await getRecommendationsData();
      
      // Apply search only - filtering and pagination will be handled in the island
      const searchedEpisodes = searchEpisodes(episodes, searchQuery);

      return ctx.render({
        episodes: searchedEpisodes,
        host,
        category,
        searchQuery,
        currentPage,
      });
    } catch (error) {
      console.error("Error in recommendations handler:", error);
      return ctx.render({
        episodes: [],
        host: "all",
        category: "all",
        searchQuery: "",
        currentPage: 1,
      });
    }
  },
};

export const recommendationsCacheUtils = {
  invalidateCache() {
    recommendationsCache.clear();
  },

  async warmCache() {
    try {
      await getRecommendationsData();
    } catch (error) {
      console.error("Error warming recommendations cache:", error);
    }
  },

  async updateCacheWithEpisode(episode: Episode) {
    const cached = recommendationsCache.get('all_recommendations');
    if (cached) {
      const episodes = [...cached.episodes];
      const processed = processEpisodeRecommendations(episode);
      
      if (processed) {
        const existingIndex = episodes.findIndex(ep => ep.id === episode.id);
        if (existingIndex >= 0) {
          episodes[existingIndex] = processed;
        } else {
          episodes.push(processed);
        }

        episodes.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        recommendationsCache.set('all_recommendations', {
          episodes,
          timestamp: Date.now()
        });
      }
    }
  }
};

export default function OneMoreThingPage({ data }: PageProps<PageData>) {
  return (
    <Layout>
      <div class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-6">One More Thing Recommendations</h1>
        
        <SearchBar
          searchQuery={data.searchQuery}
          placeholder="Search episodes and recommendations..."
          showClear={true}
        />
        
        <EpisodeFilter
          episodes={data.episodes}
          initialHost={data.host}
          initialCategory={data.category}
          currentPage={data.currentPage}
          searchQuery={data.searchQuery}
        />
      </div>
    </Layout>
  );
}

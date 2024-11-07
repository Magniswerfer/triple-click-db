import { useState, useEffect } from "preact/hooks";
import PaginationIsland from "./PaginationIsland.tsx";
import RecommendationCard from "./RecommendationCard.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";

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

interface EpisodeFilterProps {
  episodes: Episode[];
  initialHost: string;
  initialCategory: string;
  currentPage: number;
  searchQuery: string;
}

const CATEGORIES: OneMoreThingCategory[] = [
  "Game",
  "Book",
  "TV-Show",
  "Movie",
  "Podcast",
  "Misc",
];
const HOSTS = ["all", "kirk", "maddy", "jason"];
const ITEMS_PER_PAGE = 20; // Increased for wider grid

export default function EpisodeFilter({
  episodes,
  initialHost,
  initialCategory,
  currentPage,
  searchQuery,
}: EpisodeFilterProps) {
  const [activeHost, setActiveHost] = useState(initialHost);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    setActiveHost(initialHost);
    setActiveCategory(initialCategory);
    setPage(currentPage);
  }, [initialHost, initialCategory, currentPage]);

  // Transform episodes into recommendation cards
  const allRecommendations: RecommendationCard[] = episodes.flatMap(
    (episode) => {
      const cards: RecommendationCard[] = [];
      Object.entries(episode.sections.oneMoreThing).forEach(([host, rec]) => {
        if (rec.content) {
          cards.push({
            id: episode.id,
            episodeNumber: episode.episodeNumber,
            episodeTitle: episode.title,
            date: episode.date,
            host,
            content: rec.content,
            category: rec.category,
          });
        }
      });
      return cards;
    },
  );

  // Filter recommendations
  const filteredRecommendations = allRecommendations.filter((rec) => {
    if (activeHost !== "all" && rec.host !== activeHost) return false;
    if (activeCategory !== "all" && rec.category !== activeCategory) {
      return false;
    }
    return true;
  });

  // Calculate pagination
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE),
  );
  const validCurrentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecommendations = filteredRecommendations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Update URL helper function
  const updateURL = (newHost?: string, newCategory?: string, newPage?: number) => {
    if (!IS_BROWSER) return;

    const url = new URL(window.location.href);

    // Update host if provided
    if (newHost !== undefined) {
      if (newHost !== "all") {
        url.searchParams.set("host", newHost);
      } else {
        url.searchParams.delete("host");
      }
    }

    // Update category if provided
    if (newCategory !== undefined) {
      if (newCategory !== "all") {
        url.searchParams.set("category", newCategory);
      } else {
        url.searchParams.delete("category");
      }
    }

    // Update page if provided
    if (newPage !== undefined) {
      if (newPage > 1) {
        url.searchParams.set("omtPage", newPage.toString());
      } else {
        url.searchParams.delete("omtPage");
      }
    }

    // Preserve search query if it exists
    if (searchQuery) {
      url.searchParams.set("q", searchQuery);
    }

    window.location.href = url.toString();
  };

  // Handle filter changes
  const handleFilterChange = (newHost: string, newCategory: string) => {
    setPage(1); // Reset to first page when filters change
    updateURL(newHost, newCategory, 1);
  };

  return (
    <div>
      {/* Filter tabs */}
      <div class="mb-6 space-y-4">
        {/* Host filter */}
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            {HOSTS.map((host) => (
              <button
                key={host}
                onClick={() => handleFilterChange(host, activeCategory)}
                class={`py-2 px-4 text-sm font-medium mr-2 transition-colors duration-200 ${activeHost === host
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {host.charAt(0).toUpperCase() + host.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Category filter */}
        <div class="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange(activeHost, "all")}
            class={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${activeCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleFilterChange(activeHost, category)}
              class={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${activeCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid layout */}
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {paginatedRecommendations.map((rec) => (
          <RecommendationCard key={`${rec.id}-${rec.host}`} {...rec} />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div class="text-center text-gray-500 mt-8">
          No recommendations found for these filters.
        </div>
      )}

      {filteredRecommendations.length > 0 && (
        <div class="mt-8">
          <PaginationIsland
            currentPage={validCurrentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            paramName="omtPage"
          />
        </div>
      )}
    </div>
  );
}

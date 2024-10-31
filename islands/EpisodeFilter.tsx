import { useEffect, useState } from "preact/hooks";
import { Pagination } from "../components/Pagination.tsx";

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
const ITEMS_PER_PAGE = 10;

interface RecommendationCard {
  id: string; // episode id
  episodeNumber: number;
  episodeTitle: string;
  date: string;
  host: string;
  content: string;
  category: OneMoreThingCategory;
}

export default function EpisodeFilter({
  episodes,
  initialHost,
  initialCategory,
  currentPage,
  searchQuery,
}: EpisodeFilterProps) {
  const [activeHost, setActiveHost] = useState(initialHost);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveHost(initialHost);
    setActiveCategory(initialCategory);
  }, [initialHost, initialCategory]);

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
  const ITEMS_PER_PAGE = 12; // Increased since we'll have more cards
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE),
  );
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecommendations = filteredRecommendations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Update URL when filters change
  const updateURL = (newHost: string, newCategory: string) => {
    const url = new URL(location.href);
    if (newHost !== "all") {
      url.searchParams.set("host", newHost);
    } else {
      url.searchParams.delete("host");
    }

    if (newCategory !== "all") {
      url.searchParams.set("category", newCategory);
    } else {
      url.searchParams.delete("category");
    }

    url.searchParams.set("page", "1");
    if (searchQuery) {
      url.searchParams.set("search", searchQuery);
    }

    location.href = url.toString();
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
                onClick={() => {
                  updateURL(host, activeCategory);
                }}
                class={`py-2 px-4 text-sm font-medium mr-2 transition-colors duration-200 ${
                  activeHost === host
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
            onClick={() => {
              updateURL(activeHost, "all");
            }}
            class={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
              activeCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                updateURL(activeHost, category);
              }}
              class={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                activeCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {paginatedRecommendations.map((rec) => (
          <div
            key={`${rec.id}-${rec.host}`}
            class="break-inside-avoid-column bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow flex flex-col inline-block w-full"
          >
            <div class="p-4 flex flex-col">
              {/* Recommendation content */}
              <p class="text-lg mb-2">{rec.content}</p>{" "}
              {/* Changed from mb-4 to mb-2 */}
              {/* Metadata section */}
              <div class="mt-2">
                {" "}
                {/* Changed from mt-4 to mt-2 */}
                {/* Category and host */}
                <div class="flex items-center gap-2 mb-3">
                  <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                    {rec.category}
                  </span>
                  <span class="text-sm text-gray-600 capitalize whitespace-nowrap">
                    by {rec.host}
                  </span>
                </div>
                {/* Episode link */}
                <div class="pt-3 border-t">
                  <a
                    href={`/episodes/${rec.id}`}
                    class="text-sm text-gray-600 hover:text-blue-600"
                  >
                    <div class="line-clamp-1">
                      Episode {rec.episodeNumber}: {rec.episodeTitle}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {new Date(rec.date).toLocaleDateString()}
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div class="text-center text-gray-500 mt-8">
          No recommendations found for these filters.
        </div>
      )}

      {filteredRecommendations.length > 0 && (
        <div class="mt-8">
          <Pagination
            currentPage={validCurrentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
          />
        </div>
      )}
    </div>
  );
}

import { useState } from "preact/hooks";

type OneMoreThingCategory = "Game" | "Book" | "TV-Show" | "Movie" | "Podcast" | "Misc";

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
}

const CATEGORIES: OneMoreThingCategory[] = ["Game", "Book", "TV-Show", "Movie", "Podcast", "Misc"];
const HOSTS = ["all", "kirk", "maddy", "jason"];

export default function EpisodeFilter({ episodes, initialHost, initialCategory }: EpisodeFilterProps) {
  const [activeHost, setActiveHost] = useState(initialHost);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Filter episodes based on active filters
  const filteredEpisodes = episodes.filter(episode => {
    // Host filter
    if (activeHost !== "all") {
      const hostEntry = episode.sections.oneMoreThing[activeHost as keyof typeof episode.sections.oneMoreThing];
      if (!hostEntry.content) return false;
      
      // If category is also active, check both conditions
      if (activeCategory !== "all") {
        return hostEntry.category === activeCategory;
      }
      return true;
    }

    // Category filter only
    if (activeCategory !== "all") {
      return Object.values(episode.sections.oneMoreThing).some(
        entry => entry.content && entry.category === activeCategory
      );
    }

    return true;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div class="mb-6 space-y-4">
        {/* Host filter */}
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            {HOSTS.map(host => (
              <button
                key={host}
                onClick={() => setActiveHost(host)}
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
            onClick={() => setActiveCategory("all")}
            class={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
              activeCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
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

      {/* Episode cards */}
      {filteredEpisodes.map(episode => (
        <div 
          key={episode.id} 
          class="mb-4 p-4 border rounded-lg shadow-sm bg-white"
        >
          <div class="mb-3">
            <h2 class="text-xl font-semibold">
              Episode {episode.episodeNumber}: {episode.title}
            </h2>
            <div class="text-sm text-gray-500">
              {new Date(episode.date).toLocaleDateString()}
            </div>
          </div>
          <div class="space-y-2">
            {(activeHost === "all" || activeHost === "kirk") && 
              episode.sections.oneMoreThing.kirk.content && (
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold">Kirk:</span>
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {episode.sections.oneMoreThing.kirk.category}
                    </span>
                  </div>
                  <div class="mt-1">
                    {episode.sections.oneMoreThing.kirk.content}
                  </div>
                </div>
            )}
            
            {(activeHost === "all" || activeHost === "maddy") && 
              episode.sections.oneMoreThing.maddy.content && (
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold">Maddy:</span>
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {episode.sections.oneMoreThing.maddy.category}
                    </span>
                  </div>
                  <div class="mt-1">
                    {episode.sections.oneMoreThing.maddy.content}
                  </div>
                </div>
            )}
            
            {(activeHost === "all" || activeHost === "jason") && 
              episode.sections.oneMoreThing.jason.content && (
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold">Jason:</span>
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {episode.sections.oneMoreThing.jason.category}
                    </span>
                  </div>
                  <div class="mt-1">
                    {episode.sections.oneMoreThing.jason.content}
                  </div>
                </div>
            )}
          </div>
        </div>
      ))}
      {filteredEpisodes.length === 0 && (
        <div class="text-center text-gray-500 mt-8">
          No recommendations found for these filters.
        </div>
      )}
    </div>
  );
}

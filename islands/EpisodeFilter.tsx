import { useState } from "preact/hooks";

interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  date: string;
  sections: {
    oneMoreThing: {
      kirk: string;
      maddy: string;
      jason: string;
    };
  };
}

interface EpisodeFilterProps {
  episodes: Episode[];
}

export default function EpisodeFilter({ episodes }: EpisodeFilterProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredEpisodes = episodes.filter(episode => {
    if (activeTab === "all") return true;
    return episode.sections.oneMoreThing[activeTab as keyof typeof episode.sections.oneMoreThing];
  });

  return (
    <div>
      {/* Custom tabs */}
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            {["all", "kirk", "maddy", "jason"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                class={`py-2 px-4 text-sm font-medium mr-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
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
            {(activeTab === "all" || activeTab === "kirk") && 
              episode.sections.oneMoreThing.kirk && (
                <div>
                  <span class="font-bold">Kirk:</span>{" "}
                  {episode.sections.oneMoreThing.kirk}
                </div>
            )}
            
            {(activeTab === "all" || activeTab === "maddy") && 
              episode.sections.oneMoreThing.maddy && (
                <div>
                  <span class="font-bold">Maddy:</span>{" "}
                  {episode.sections.oneMoreThing.maddy}
                </div>
            )}
            
            {(activeTab === "all" || activeTab === "jason") && 
              episode.sections.oneMoreThing.jason && (
                <div>
                  <span class="font-bold">Jason:</span>{" "}
                  {episode.sections.oneMoreThing.jason}
                </div>
            )}
          </div>
        </div>
      ))}

      {filteredEpisodes.length === 0 && (
        <div class="text-center text-gray-500 mt-8">
          No recommendations found for this filter.
        </div>
      )}
    </div>
  );
}

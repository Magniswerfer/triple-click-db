import { useState } from "preact/hooks";
import { Episode, GameReference, OneMoreThingCategory } from "../types.ts";
import GameSearchModal from "./GameSearchModal.tsx";

const CATEGORIES: OneMoreThingCategory[] = ["Game", "Book", "TV-Show", "Movie", "Podcast", "Misc"];

interface Props {
  episodes: Episode[];
}

export default function EpisodeManager({ episodes }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [editedEpisode, setEditedEpisode] = useState<Episode | null>(null);
  const [isGameSearchOpen, setIsGameSearchOpen] = useState(false);

  // Filter episodes based on search term
  const filteredEpisodes = episodes.filter(episode =>
    episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    episode.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    episode.sections.mainText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.values(episode.sections.oneMoreThing).some(entry => 
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleGameAdd = (game: GameReference) => {
    if (!editedEpisode) return;

    // Check if game is already added
    if (editedEpisode.games.some(g => g.id === game.id)) {
      alert("This game is already added to the episode");
      return;
    }

    // Add the game to the episode
    setEditedEpisode({
      ...editedEpisode,
      games: [...(editedEpisode.games || []), game]
    });
  };

  const handleGameRemove = (gameId: string) => {
    if (!editedEpisode) return;

    setEditedEpisode({
      ...editedEpisode,
      games: editedEpisode.games.filter(g => g.id !== gameId)
    });
  };

  const handleSave = async () => {
    if (!editedEpisode) return;

    try {
      const response = await fetch("/api/episodes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedEpisode),
      });

      if (!response.ok) {
        throw new Error("Failed to save episode");
      }

      // Reset states and show success message
      setSelectedEpisode(editedEpisode);
      setEditedEpisode(null);
      alert("Episode saved successfully!");
    } catch (error) {
      console.error("Error saving episode:", error);
      alert("Failed to save episode. Please try again.");
    }
  };

  return (
    <div class="space-y-6">
      {/* Search bar */}
      <div class="mb-6">
        <input
          type="text"
          placeholder="Search episodes..."
          value={searchTerm}
          onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          class="w-full p-2 border rounded-lg"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Episode list */}
        <div class="border rounded-lg p-4">
          <h2 class="text-xl font-semibold mb-4">Episodes</h2>
          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEpisodes.map(episode => (
              <button
                key={episode.id}
                onClick={() => {
                  setSelectedEpisode(episode);
                  setEditedEpisode(null);
                }}
                class={`w-full text-left p-2 rounded ${
                  selectedEpisode?.id === episode.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <div class="font-medium">
                  #{episode.episodeNumber} - {episode.title}
                </div>
                <div class="text-sm text-gray-500">
                  {new Date(episode.date).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Episode details/editor */}
        <div class="border rounded-lg p-4">
          {selectedEpisode && !editedEpisode ? (
            <div>
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Episode Details</h2>
                <button
                  onClick={() => setEditedEpisode({ 
                    ...selectedEpisode,
                    games: selectedEpisode.games || []
                  })}
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
              <div class="space-y-4">
                <div>
                  <h3 class="font-medium">Title</h3>
                  <p>{selectedEpisode.title}</p>
                </div>
                <div>
                  <h3 class="font-medium">Episode Number</h3>
                  <p>{selectedEpisode.episodeNumber}</p>
                </div>
                <div>
                  <h3 class="font-medium">Date</h3>
                  <p>{new Date(selectedEpisode.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 class="font-medium">Games Discussed</h3>
                  {selectedEpisode.games?.length ? (
                    <div class="flex flex-wrap gap-2">
                      {selectedEpisode.games.map(game => (
                        <span key={game.id} class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {game.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p class="text-gray-500">No games listed</p>
                  )}
                </div>
                <div>
                  <h3 class="font-medium">Main Text</h3>
                  <p class="whitespace-pre-wrap">{selectedEpisode.sections.mainText}</p>
                </div>
                <div>
                  <h3 class="font-medium">One More Thing</h3>
                  <div class="space-y-4">
                    {(["kirk", "maddy", "jason"] as const).map((host) => (
                      <div key={host}>
                        <div class="flex items-center gap-2">
                          <strong class="capitalize">{host}:</strong>
                          <span class="inline-block px-2 py-1 text-sm bg-gray-100 rounded">
                            {selectedEpisode.sections.oneMoreThing[host].category}
                          </span>
                        </div>
                        <p class="mt-1">
                          {selectedEpisode.sections.oneMoreThing[host].content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 class="font-medium">Type</h3>
                  <p>{selectedEpisode.type}</p>
                </div>
              </div>
            </div>
          ) : editedEpisode ? (
            <div>
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Edit Episode</h2>
                <div class="space-x-2">
                  <button
                    onClick={() => setEditedEpisode(null)}
                    class="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editedEpisode.title}
                    onChange={(e) => 
                      setEditedEpisode({
                        ...editedEpisode,
                        title: (e.target as HTMLInputElement).value
                      })
                    }
                    class="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label class="block font-medium mb-1">Games</label>
                  <div class="space-y-2">
                    {editedEpisode.games?.map(game => (
                      <div key={game.id} class="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <span>{game.title}</span>
                        <button
                          onClick={() => handleGameRemove(game.id)}
                          class="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setIsGameSearchOpen(true)}
                      class="w-full px-3 py-2 border rounded hover:bg-gray-50 text-sm"
                    >
                      Add Game
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block font-medium mb-1">Main Text</label>
                  <textarea
                    value={editedEpisode.sections.mainText}
                    onChange={(e) => 
                      setEditedEpisode({
                        ...editedEpisode,
                        sections: {
                          ...editedEpisode.sections,
                          mainText: (e.target as HTMLTextAreaElement).value
                        }
                      })
                    }
                    class="w-full p-2 border rounded"
                    rows={6}
                  />
                </div>
                <div>
                  <label class="block font-medium mb-1">One More Thing</label>
                  <div class="space-y-4">
                    {(["kirk", "maddy", "jason"] as const).map((host) => (
                      <div key={host} class="space-y-2">
                        <label class="block text-sm capitalize">{host}</label>
                        <textarea
                          value={editedEpisode.sections.oneMoreThing[host].content}
                          onChange={(e) => 
                            setEditedEpisode({
                              ...editedEpisode,
                              sections: {
                                ...editedEpisode.sections,
                                oneMoreThing: {
                                  ...editedEpisode.sections.oneMoreThing,
                                  [host]: {
                                    ...editedEpisode.sections.oneMoreThing[host],
                                    content: (e.target as HTMLTextAreaElement).value
                                  }
                                }
                              }
                            })
                          }
                          class="w-full p-2 border rounded"
                          rows={3}
                        />
                        <select
                          value={editedEpisode.sections.oneMoreThing[host].category}
                          onChange={(e) => 
                            setEditedEpisode({
                              ...editedEpisode,
                              sections: {
                                ...editedEpisode.sections,
                                oneMoreThing: {
                                  ...editedEpisode.sections.oneMoreThing,
                                  [host]: {
                                    ...editedEpisode.sections.oneMoreThing[host],
                                    category: e.target.value as OneMoreThingCategory
                                  }
                                }
                              }
                            })
                          }
                          class="w-full mt-1 p-2 border rounded"
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div class="text-center text-gray-500 py-12">
              Select an episode to view or edit its details
            </div>
          )}
        </div>
      </div>

      <GameSearchModal
        isOpen={isGameSearchOpen}
        onClose={() => setIsGameSearchOpen(false)}
        onGameSelect={handleGameAdd}
      />
    </div>
  );
}

import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { GameCard } from "../../components/GameCard.tsx";
import { kv } from "../../utils/db.ts";
import { Episode, Game } from "../../types.ts";

interface EpisodePageData {
  episode: Episode;
  games: Game[];
}

export const handler: Handlers<EpisodePageData> = {
  async GET(_req, ctx) {
    const episodeId = ctx.params.episode;
    
    // Get episode
    const episodeEntry = await kv.get<Episode>(["episodes", episodeId]);
    if (!episodeEntry.value) {
      return new Response("Episode not found", { status: 404 });
    }
    
    const episode = episodeEntry.value;

    // Get full game details for all games mentioned
    const games: Game[] = [];
    if (episode.games) {
      for (const gameRef of episode.games) {
        const gameEntry = await kv.get<Game>(["games", gameRef.id]);
        if (gameEntry.value) {
          games.push(gameEntry.value);
        }
      }
    }

    return ctx.render({ episode, games });
  },
};

export default function EpisodePage({ data }: PageProps<EpisodePageData>) {
  const { episode, games } = data;
  
  // Helper function to get category badge color
  const getCategoryColor = (category: string) => {
    const colors = {
      "Game": "bg-blue-100 text-blue-800",
      "Book": "bg-green-100 text-green-800",
      "TV-Show": "bg-purple-100 text-purple-800",
      "Movie": "bg-red-100 text-red-800",
      "Podcast": "bg-yellow-100 text-yellow-800",
      "Misc": "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.Misc;
  };

  // Helper function to format name
  const formatName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
  
  return (
    <Layout>
      <Head>
        <title>{episode.title} - Triple Click</title>
      </Head>

      <div class="container mx-auto px-4 py-8">
        <nav class="mb-6">
          <a href="/episodes" class="text-blue-600 hover:underline">
            ← Back to all episodes
          </a>
        </nav>

        <article class="max-w-4xl mx-auto">
          {/* Episode Header */}
          <header class="mb-8">
            <h1 class="text-3xl font-bold mb-2">
              #{episode.episodeNumber} - {episode.title}
            </h1>
            <div class="flex flex-wrap gap-4 text-gray-600">
              <time datetime={episode.date}>
                {new Date(episode.date).toLocaleDateString()}
              </time>
              <div>Duration: {episode.duration}</div>
              {episode.explicit && (
                <div class="text-red-600">Explicit</div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div class="prose max-w-none mb-8">
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-3">Episode Description</h2>
              <p class="whitespace-pre-wrap">{episode.sections.mainText}</p>
            </div>

            {/* One More Thing Section */}
            <div class="mb-8" id="one-more-thing">
              <h2 class="text-xl font-semibold mb-4">One More Thing</h2>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(['kirk', 'maddy', 'jason'] as const).map((person) => {
                  const entry = episode.sections.oneMoreThing[person];
                  return (
                    <div key={person} class="bg-gray-50 rounded-lg p-4">
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="font-medium">{formatName(person)}'s Pick</h3>
                        <span 
                          class={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(entry.category)}`}
                        >
                          {entry.category}
                        </span>
                      </div>
                      <p class="text-gray-700">{entry.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Games Section */}
            {games.length > 0 && (
              <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Games Discussed</h2>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} showGenres={false} />
                  ))}
                </div>
              </div>
            )}

          
          </div>
        </article>
      </div>
    </Layout>
  );
}

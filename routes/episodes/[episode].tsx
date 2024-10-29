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
  
  return (
    <Layout>
      <Head>
        <title>{episode.title} - Triple Click</title>
      </Head>

      <nav class="mb-6">
        <a href="/episodes" class="text-blue-600 hover:underline">
          ← Back to all episodes
        </a>
      </nav>

      <article class="max-w-4xl">
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
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-3">One More Thing</h2>
            <div class="space-y-4 bg-gray-50 p-4 rounded-lg">
              {episode.sections.oneMoreThing.kirk && (
                <div>
                  <h3 class="font-medium">Kirk's Pick</h3>
                  <p>{episode.sections.oneMoreThing.kirk}</p>
                </div>
              )}
              {episode.sections.oneMoreThing.maddy && (
                <div>
                  <h3 class="font-medium">Maddy's Pick</h3>
                  <p>{episode.sections.oneMoreThing.maddy}</p>
                </div>
              )}
              {episode.sections.oneMoreThing.jason && (
                <div>
                  <h3 class="font-medium">Jason's Pick</h3>
                  <p>{episode.sections.oneMoreThing.jason}</p>
                </div>
              )}
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

          {/* Episode Links */}
          <div class="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 class="text-xl font-semibold mb-3">Listen to this Episode</h2>
            <a 
              href={episode.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline inline-block"
            >
              Listen on Simplecast →
            </a>
          </div>
        </div>
      </article>
    </Layout>
  );
}

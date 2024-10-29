import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import  Layout  from "../../components/Layout.tsx";
import { EpisodeCard } from "../../components/EpisodeCard.tsx";
import { kv } from "../../utils/db.ts";
import { Episode } from "../../types.ts";

export const handler: Handlers<{ episodes: Episode[] }> = {
  async GET(_, ctx) {
    const entries = await kv.list<Episode>({ prefix: ["episodes"] });
    const episodes: Episode[] = [];
    
    for await (const entry of entries) {
      episodes.push(entry.value);
    }
    
    // Sort by episode number descending
    episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
    
    return ctx.render({ episodes });
  },
};

export default function EpisodesPage({ data }: PageProps<{ episodes: Episode[] }>) {
  const { episodes } = data;

  return (
    <Layout>
      <Head>
        <title>Episodes - Triple Click</title>
      </Head>

      <h1 class="text-3xl font-bold mb-6">All Episodes</h1>

      <div class="space-y-6">
        {episodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>
    </Layout>
  );
}

import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { kv } from "../../utils/db.ts";
import EpisodeManager from "../../islands/EpisodeManager.tsx";
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
  }
};

export default function AdminPage({ data }: PageProps<{ episodes: Episode[] }>) {
  return (
    <Layout>
      <Head>
        <title>Admin - Triple Click DB</title>
      </Head>
      
      <h1 class="text-3xl font-bold mb-6">Episode Management</h1>
      <EpisodeManager episodes={data.episodes} />
    </Layout>
  );
}

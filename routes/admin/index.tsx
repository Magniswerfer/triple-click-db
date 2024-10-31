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
      
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Episode Management</h1>
        <a 
          href="/logout" 
          class="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        >
          Logout
        </a>
      </div>

      <EpisodeManager episodes={data.episodes} />
    </Layout>
  );
}

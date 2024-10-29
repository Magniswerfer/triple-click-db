import { Handlers, PageProps } from "$fresh/server.ts";
import EpisodeFilter from "../islands/EpisodeFilter.tsx";
import Layout from "../components/Layout.tsx";

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

export const handler: Handlers<Episode[]> = {
  async GET(_, ctx) {
    const kv = await Deno.openKv();
    const episodes: Episode[] = [];
    
    // Fetch all episodes from KV store
    const episodeEntries = kv.list({ prefix: ["episodes"] });
    for await (const entry of episodeEntries) {
      episodes.push(entry.value);
    }
    
    // Sort episodes by date (newest first)
    episodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter out episodes without recommendations
    const episodesWithRecommendations = episodes.filter(episode => 
      episode.sections.oneMoreThing.kirk ||
      episode.sections.oneMoreThing.maddy ||
      episode.sections.oneMoreThing.jason
    );

    return ctx.render(episodesWithRecommendations);
  },
};

export default function OneMoreThingPage({ data: episodes }: PageProps<Episode[]>) {
  return (
    <Layout>
    <div class="container">
      <h1 class="text-3xl font-bold mb-6">One More Thing Recommendations</h1>
      <EpisodeFilter episodes={episodes} />
    </div>
    </Layout>
  );
}


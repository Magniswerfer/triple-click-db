import { Handlers, PageProps } from "$fresh/server.ts";
import EpisodeFilter from "../islands/EpisodeFilter.tsx";
import Layout from "../components/Layout.tsx";

interface OneMoreThingEntry {
  content: string;
  category: "Game" | "Book" | "TV-Show" | "Movie" | "Podcast" | "Misc";
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

interface PageData {
  episodes: Episode[];
  host: string | null;
  category: string | null;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const host = url.searchParams.get("host");
    const category = url.searchParams.get("category");

    const kv = await Deno.openKv();
    const episodes: Episode[] = [];
    
    // Fetch all episodes from KV store
    const episodeEntries = kv.list({ prefix: ["episodes"] });
    for await (const entry of episodeEntries) {
      episodes.push(entry.value);
    }
    
    // Sort episodes by date (newest first)
    episodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter out episodes without recommendations and apply host/category filters
    const filteredEpisodes = episodes.filter(episode => {
      // First check if there are any recommendations
      const hasRecommendations = 
        episode.sections.oneMoreThing.kirk.content ||
        episode.sections.oneMoreThing.maddy.content ||
        episode.sections.oneMoreThing.jason.content;

      if (!hasRecommendations) return false;

      // Apply host filter if specified
      if (host && host !== "all") {
        const hostEntry = episode.sections.oneMoreThing[host as keyof typeof episode.sections.oneMoreThing];
        if (!hostEntry.content) return false;
        // If category is also specified, check both conditions
        if (category && category !== "all") {
          return hostEntry.category === category;
        }
        return true;
      }

      // Apply category filter if specified
      if (category && category !== "all") {
        return Object.values(episode.sections.oneMoreThing).some(
          entry => entry.content && entry.category === category
        );
      }

      return true;
    });

    return ctx.render({ 
      episodes: filteredEpisodes,
      host,
      category
    });
  },
};

export default function OneMoreThingPage({ data }: PageProps<PageData>) {
  return (
    <Layout>
      <div class="container">
        <h1 class="text-3xl font-bold mb-6">One More Thing Recommendations</h1>
        <EpisodeFilter 
          episodes={data.episodes} 
          initialHost={data.host || "all"} 
          initialCategory={data.category || "all"} 
        />
      </div>
    </Layout>
  );
}

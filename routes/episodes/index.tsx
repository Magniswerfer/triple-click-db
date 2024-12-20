import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { EpisodeCard } from "../../components/EpisodeCard.tsx";
import PaginationIsland from "../../islands/PaginationIsland.tsx";
import { kv } from "../../utils/db.ts";
import { Episode } from "../../types.ts";

const ITEMS_PER_PAGE = 10;

interface EpisodesPageData {
  episodes: {
    items: Episode[];
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

// Utility function to get paginated episodes
async function getPaginatedEpisodes(page: number) {
  const entries = kv.list<Episode>({ prefix: ["episodes"] });
  const allEpisodes: Episode[] = [];
  for await (const entry of entries) {
    if (entry?.value) {
      allEpisodes.push(entry.value);
    }
  }
  allEpisodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
  const total = allEpisodes.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  return {
    items: allEpisodes.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    currentPage,
    totalPages,
    total
  };
}

export const handler: Handlers<EpisodesPageData> = {
  async GET(req, ctx) {
    try {
      // Force async state
      await new Promise(resolve => setTimeout(resolve, 0));

      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("episodePage") || "1");
      const episodes = await getPaginatedEpisodes(page);
      return ctx.render({ episodes });
    } catch (error) {
      console.error("Error in episodes handler:", error);
      return ctx.render({
        episodes: {
          items: [],
          currentPage: 1,
          totalPages: 0,
          total: 0
        }
      });
    }
  },
};

export default function EpisodesPage({ data }: PageProps<EpisodesPageData>) {
  const { episodes } = data;

  return (
    <Layout>
      <Head>
        <title>Episodes - Triple Click</title>
        <meta name="description" content="Browse all Triple Click podcast episodes" />
      </Head>

      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-3xl font-bold" data-section="episodePage">
            All Episodes
          </h1>
          <div class="text-gray-600">
            {episodes.total} episode{episodes.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        {episodes.items.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>

      <div class="mt-8">
        <PaginationIsland
          currentPage={episodes.currentPage}
          totalPages={episodes.totalPages}
          searchQuery=""
          paramName="episodePage"
        />
      </div>
    </Layout>
  );
}

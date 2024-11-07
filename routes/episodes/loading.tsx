import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { EpisodeCardSkeleton } from "../../components/EpisodeCard.tsx";

export default function Loading() {
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
            {/* Empty state for count */}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <EpisodeCardSkeleton key={index} />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div class="mt-8 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            class="w-10 h-10 rounded bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    </Layout>
  );
}

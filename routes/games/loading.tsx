import { Head } from "$fresh/runtime.ts";
import Layout from "../../components/Layout.tsx";
import { GameCardSkeleton } from "../../components/GameCard.tsx";

export default function Loading() {
  return (
    <Layout>
      <Head>
        <title>Games Discussed - Triple Click</title>
      </Head>

      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-4" data-section="gamePage">
          Games Discussed
        </h1>
        <div class="h-6">
          {/* Empty height placeholder for the stats */}
        </div>
      </div>

      <div id="games-content">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 27 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div class="flex justify-center mt-8 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              class="w-10 h-10 rounded bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

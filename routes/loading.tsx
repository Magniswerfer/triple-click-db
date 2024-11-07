import { Head } from "$fresh/runtime.ts";
import Layout from "../components/Layout.tsx";
import { EpisodeCardSkeleton } from "../components/EpisodeCard.tsx";
import { GameCardSkeleton } from "../components/GameCard.tsx";

export default function Loading() {
  return (
    <Layout>
      <Head>
        <title>Triple Click DB</title>
      </Head>

      {/* Recently Discussed Games */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Recently Discussed Games</h2>
          <a href="/games" class="text-secondary-400 hover:underline">
            View all games →
          </a>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Latest Episodes */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Latest Episodes</h2>
          <a href="/episodes" class="text-secondary-400 hover:underline">
            View all episodes →
          </a>
        </div>

        <div class="space-y-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <EpisodeCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Most Discussed Games */}
      <section class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Most Discussed Games</h2>
          <a href="/games" class="text-secondary-400 hover:underline">
            View all games →
          </a>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GameCardSkeleton key={i} variant="most-discussed" />
          ))}
        </div>
      </section>

      {/* Triple Click Picks */}
      <section>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Triple Click Picks</h2>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

// utils/db.ts
import "$std/dotenv/load.ts";

// Utility types
export interface PaginationOptions {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}

// Check if we're in Deno Deploy
const isDeploy = Deno.env.has("DENO_DEPLOYMENT_ID");

// Initialize KV
export const kv = await Deno.openKv(isDeploy ? undefined : Deno.env.get("DENO_KV_URL"));

// Optional: Close KV on process exit
globalThis.addEventListener("unload", () => {
  kv.close();
});

export async function paginatedKvList<T>({
  prefix,
  options,
}: {
  prefix: Deno.KvKey;
  options: PaginationOptions;
}): Promise<PaginatedResult<T>> {
  const { limit, cursor } = options;

  const iter = kv.list<T>({ prefix }, {
    limit: limit + 1, // Get one extra to check if there's more
    cursor: cursor ? cursor : undefined,
  });

  const items: T[] = [];
  for await (const entry of iter) {
    items.push(entry.value);
  }

  // Check if there are more items
  const hasMore = items.length > limit;
  if (hasMore) {
    items.pop(); // Remove the extra item we used to check for more
  }

  return {
    items,
    cursor: iter.cursor,
    hasMore,
  };
}

// Add efficient batch operations
export async function batchGetGames(ids: string[]): Promise<Map<string, Game>> {
  const uniqueIds = [...new Set(ids)];
  const gamePromises = uniqueIds.map((id) => kv.get<Game>(["games", id]));
  const results = await Promise.all(gamePromises);

  return new Map(
    results
      .filter((result) => result.value)
      .map((result) => [result.value!.id, result.value!])
  );
}

// Add cache wrapper
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

import { load } from "$std/dotenv/mod.ts";
import { Game } from "../types.ts";

await load({ export: true });

const kv = await Deno.openKv(Deno.env.get("DENO_KV_URL"), {
  accessToken: Deno.env.get("DENO_KV_ACCESS_TOKEN"),
});

async function checkGames() {
  try {
    // Get all games from KV
    const gamesIterator = kv.list<Game>({ prefix: ["games"] });
    
    for await (const entry of gamesIterator) {
      const game = entry.value;
      console.log('\nGame:', {
        title: game.title,
        id: game.id,
        igdbId: game.igdbId,
        cover: game.cover, // This will show us the cover data structure
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    kv.close();
  }
}

await checkGames();


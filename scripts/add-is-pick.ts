// scripts/add_is_pick.ts
import { load } from "$std/dotenv/mod.ts";
import { Game } from "../types.ts";

await load({ export: true });

const DENO_KV_URL = Deno.env.get("DENO_KV_URL");
const DENO_KV_ACCESS_TOKEN = Deno.env.get("DENO_KV_ACCESS_TOKEN");

// Check for missing environment variables
if (!DENO_KV_URL || !DENO_KV_ACCESS_TOKEN) {
  console.error("Missing required environment variables: DENO_KV_URL and/or DENO_KV_ACCESS_TOKEN");
  Deno.exit(1);
}

const kv = await Deno.openKv(DENO_KV_URL, {
  accessToken: DENO_KV_ACCESS_TOKEN,
});

async function addIsPickField() {
  try {
    console.log("Starting to add isPick field to all games...");

    let updateCount = 0;
    let errorCount = 0;

    const gamesIterator = kv.list<Game>({ prefix: ["games"] });

    for await (const entry of gamesIterator) {
      const game = entry.value;
      console.log(`\nProcessing ${game.title}...`);

      try {
        // Update the game object with isPick field
        const updatedGame: Game = {
          ...game,
          isPick: false, // Default to false for all games
          updatedAt: new Date()
        };

        // Store updated game in KV
        // Update both the main games entry and the games_by_igdb entry
        await Promise.all([
          kv.set(["games", game.id], updatedGame),
          kv.set(["games_by_igdb", game.igdbId], updatedGame)
        ]);

        updateCount++;
        console.log(`✓ Updated ${game.title}`);

      } catch (error) {
        console.error(`Error updating ${game.title}:`, error);
        errorCount++;
      }
    }

    console.log("\nUpdate complete!");
    console.log(`Successfully updated: ${updateCount} games`);
    console.log(`Errors encountered: ${errorCount} games`);

  } catch (error) {
    console.error("Script error:", error);
  } finally {
    kv.close();
  }
}

await addIsPickField();

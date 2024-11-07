// scripts/update_game_images.ts
import { load } from "$std/dotenv/mod.ts";
import { Game } from "../types.ts";

await load({ export: true });

const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID");
const TWITCH_CLIENT_SECRET = Deno.env.get("TWITCH_CLIENT_SECRET");
const DENO_KV_URL = Deno.env.get("DENO_KV_URL");
const DENO_KV_ACCESS_TOKEN = Deno.env.get("DENO_KV_ACCESS_TOKEN");

// Check for missing environment variables
const missingVars = [];
if (!TWITCH_CLIENT_ID) missingVars.push("TWITCH_CLIENT_ID");
if (!TWITCH_CLIENT_SECRET) missingVars.push("TWITCH_CLIENT_SECRET");
if (!DENO_KV_URL) missingVars.push("DENO_KV_URL");
if (!DENO_KV_ACCESS_TOKEN) missingVars.push("DENO_KV_ACCESS_TOKEN");

if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars.join(", "));
  Deno.exit(1);
}

async function getTwitchToken() {
  console.log("Getting Twitch OAuth token...");
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Failed to get Twitch token:", response.status, text);
    throw new Error(`Failed to get Twitch token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getGameById(gameId: number, accessToken: string) {
  console.log(`Fetching game ${gameId} from IGDB...`);
  const response = await fetch(
    "https://api.igdb.com/v4/games",
    {
      method: "POST",
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: `fields name,summary,cover.*,first_release_date,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,platforms.name,genres.name;
      where id = ${gameId};`,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("IGDB API error:", response.status, text);
    throw new Error(`IGDB API error: ${response.status}`);
  }

  const [game] = await response.json();
  console.log("IGDB response:", JSON.stringify(game, null, 2));
  return game;
}

const kv = await Deno.openKv(DENO_KV_URL, {
  accessToken: DENO_KV_ACCESS_TOKEN,
});

async function updateGames() {
  try {
    console.log("Starting game update process...");
    
    const accessToken = await getTwitchToken();
    console.log("OAuth token obtained successfully");

    let updateCount = 0;
    let errorCount = 0;

    const gamesIterator = kv.list<Game>({ prefix: ["games"] });
    
    for await (const entry of gamesIterator) {
      const game = entry.value;
      console.log(`\nProcessing ${game.title} (IGDB ID: ${game.igdbId})...`);

      try {
        const igdbGame = await getGameById(game.igdbId, accessToken);
        
        if (!igdbGame) {
          console.error(`Could not find IGDB data for ${game.title}`);
          errorCount++;
          continue;
        }

        console.log("Cover data from IGDB:", igdbGame.cover);

        // Create new cover URLs structure
        const coverUrls = igdbGame.cover ? {
          thumbnail: `https://images.igdb.com/igdb/image/upload/t_cover_small/${igdbGame.cover.image_id}.jpg`,
          full: `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${igdbGame.cover.image_id}.jpg`
        } : undefined;

        console.log("Generated cover URLs:", coverUrls);

        // Update the game object
        const updatedGame: Game = {
          ...game,
          cover: coverUrls,
          summary: igdbGame.summary || game.summary,
          companies: {
            developer: igdbGame.involved_companies?.filter(ic => ic.developer).map(ic => ic.company.name) || game.companies?.developer || [],
            publisher: igdbGame.involved_companies?.filter(ic => ic.publisher).map(ic => ic.company.name) || game.companies?.publisher || []
          },
          platforms: igdbGame.platforms?.map(p => p.name) || game.platforms || [],
          genres: igdbGame.genres?.map(g => g.name) || game.genres || [],
          updatedAt: new Date()
        };

        console.log("Updated game data:", {
          title: updatedGame.title,
          cover: updatedGame.cover,
          igdbId: updatedGame.igdbId
        });

        // Store updated game in KV
        await Promise.all([
          kv.set(["games", game.id], updatedGame),
          kv.set(["games_by_igdb", game.igdbId], updatedGame)
        ]);

        updateCount++;
        console.log(`✓ Updated ${game.title}`);
        
        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 250));

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

await updateGames();

import { Handlers } from "$fresh/server.ts";
import { kv } from "../../../utils/db.ts";
import { getGameById } from "../../../utils/igdb.ts";
import { Game } from "../../../types.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { igdbId } = await req.json();
      
      // Check if we already have this game
      const existingKey = await kv.get<Game>(["games_by_igdb", igdbId]);
      if (existingKey.value) {
        return new Response(JSON.stringify(existingKey.value), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Fetch game data from IGDB
      const igdbGame = await getGameById(igdbId);
      
      if (!igdbGame) {
        return new Response("Game not found", { status: 404 });
      }

      // Create cover URLs with different sizes if cover exists
      const coverUrls = igdbGame.cover ? {
        thumbnail: `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.jpg`,
        full: `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${igdbGame.cover.image_id}.jpg`
      } : undefined;

      // Create our game record
      const game: Game = {
        id: crypto.randomUUID(),
        igdbId: igdbGame.id,
        title: igdbGame.name,
        summary: igdbGame.summary,
        cover: coverUrls,
        releaseDate: igdbGame.first_release_date ? 
          new Date(igdbGame.first_release_date * 1000) : 
          undefined,
        companies: {
          developer: igdbGame.involved_companies?.filter(ic => ic.developer).map(ic => ic.company.name) || [],
          publisher: igdbGame.involved_companies?.filter(ic => ic.publisher).map(ic => ic.company.name) || []
        },
        platforms: igdbGame.platforms?.map(p => p.name) || [],
        genres: igdbGame.genres?.map(g => g.name) || [],
        updatedAt: new Date()
      };

      // Store in KV with both IGDB ID and our ID as keys
      const storeOps = [
        kv.set(["games", game.id], game),
        kv.set(["games_by_igdb", game.igdbId], game)
      ];
      await Promise.all(storeOps);

      return new Response(JSON.stringify(game), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error storing game:", error);
      return new Response("Failed to store game", { status: 500 });
    }
  }
};

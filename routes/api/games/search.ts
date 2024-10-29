import { Handlers } from "$fresh/server.ts";
import { searchGames } from "../../../utils/igdb.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q");
      
      if (!query) {
        return new Response("Search query required", { status: 400 });
      }

      const games = await searchGames(query);
      
      return new Response(JSON.stringify(games), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error searching games:", error);
      return new Response("Failed to search games", { status: 500 });
    }
  }
};

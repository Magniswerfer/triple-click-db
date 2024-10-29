import { Handlers } from "$fresh/server.ts";
import { kv } from "../../utils/db.ts";
import { Episode } from "../../types.ts";

export const handler: Handlers = {
  async PUT(req) {
    try {
      const episode = await req.json() as Episode;
      
      // Basic validation
      if (!episode.id || !episode.title) {
        return new Response("Invalid episode data", { status: 400 });
      }

      // Save to KV store
      await kv.set(["episodes", episode.id], episode);
      
      return new Response("Episode updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error updating episode:", error);
      return new Response("Failed to update episode", { status: 500 });
    }
  }
};

// routes/api/search.t// routes/api/search.ts
import { Handlers } from "$fresh/server.ts";
import { Episode, Game } from "../../types.ts";
import { kv } from "../../utils/db.ts";
import { filterEpisodes, filterGames } from "../../utils/search.ts";

const ITEMS_PER_PAGE = 10;

interface SearchAPIResponse {
  episodes?: {
    items: Episode[];
    total: number;
  };
  games?: {
    items: Game[];
    total: number;
  };
  oneMoreThings?: {
    items: Array<{
      content: string;
      category: string;
      episode: {
        id: string;
        title: string;
        episodeNumber: number;
      };
      person: string;
    }>;
    total: number;
  };
}

export const handler: Handlers = {
  async GET(req, _ctx) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || "";
      const episodePage = parseInt(url.searchParams.get("episodePage") || "1");
      const gamePage = parseInt(url.searchParams.get("gamePage") || "1");
      const omtPage = parseInt(url.searchParams.get("omtPage") || "1");

      // Get all content
      const allEpisodes: Episode[] = [];
      const allGames: Game[] = [];

      const episodeIter = kv.list<Episode>({ prefix: ["episodes"] });
      for await (const entry of episodeIter) {
        allEpisodes.push(entry.value);
      }

      const gameIter = kv.list<Game>({ prefix: ["games"] });
      for await (const entry of gameIter) {
        allGames.push(entry.value);
      }

      // Calculate paginated results for each section
      const matchedEpisodes = filterEpisodes(allEpisodes, query);
      const matchedGames = filterGames(allGames, query);

      // Process One More Thing entries
      const allOneMoreThings = allEpisodes.flatMap((episode) => {
        const entries = [];
        const omt = episode.sections.oneMoreThing;
        const lowerQuery = query.toLowerCase();

        ['kirk', 'maddy', 'jason'].forEach((person) => {
          if (omt[person].content.toLowerCase().includes(lowerQuery)) {
            entries.push({
              content: omt[person].content,
              category: omt[person].category,
              episode: {
                id: episode.id,
                title: episode.title,
                episodeNumber: episode.episodeNumber,
              },
              person: person.charAt(0).toUpperCase() + person.slice(1),
            });
          }
        });

        return entries;
      });

      const response: SearchAPIResponse = {
        episodes: {
          items: matchedEpisodes.slice(
            (episodePage - 1) * ITEMS_PER_PAGE, 
            episodePage * ITEMS_PER_PAGE
          ),
          total: matchedEpisodes.length,
        },
        games: {
          items: matchedGames.slice(
            (gamePage - 1) * ITEMS_PER_PAGE, 
            gamePage * ITEMS_PER_PAGE
          ),
          total: matchedGames.length,
        },
        oneMoreThings: {
          items: allOneMoreThings.slice(
            (omtPage - 1) * ITEMS_PER_PAGE,
            omtPage * ITEMS_PER_PAGE
          ),
          total: allOneMoreThings.length,
        }
      };

      return new Response(JSON.stringify(response), {
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    } catch (error) {
      console.error("Search API error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

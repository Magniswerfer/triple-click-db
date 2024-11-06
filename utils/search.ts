import { Episode, Game } from "../types.ts";

function safeIncludes(text: string | undefined | null, query: string): boolean {
  return (text || "").toLowerCase().includes(query);
}

export function filterEpisodes(episodes: Episode[], searchQuery: string) {
  if (!searchQuery) return episodes;
  if (!Array.isArray(episodes)) return [];
  
  const query = searchQuery.toLowerCase();
  return episodes.filter((episode) => {
    if (!episode) return false;

    // Basic match
    const basicMatch = 
      safeIncludes(episode.title, query) ||
      safeIncludes(episode.description, query) ||
      episode.episodeNumber?.toString().includes(query);
    
    if (basicMatch) return true;
    
    // Games match
    const gamesMatch = Array.isArray(episode.games) && episode.games.some(game => 
      game && safeIncludes(game.title, query)
    );
    
    if (gamesMatch) return true;
    
    // Sections match
    if (episode.sections) {
      // Main text
      if (safeIncludes(episode.sections.mainText, query)) {
        return true;
      }

      // One More Thing entries
      if (episode.sections.oneMoreThing) {
        const omt = episode.sections.oneMoreThing;
        return (
          safeIncludes(omt.kirk.content, query) ||
          safeIncludes(omt.maddy.content, query) ||
          safeIncludes(omt.jason.content, query)
        );
      }
    }
    
    return false;
  });
}

export function filterGames(games: Game[], searchQuery: string) {
  if (!searchQuery) return games;
  if (!Array.isArray(games)) return [];
  
  const query = searchQuery.toLowerCase();
  return games.filter((game) => {
    if (!game) return false;
    
    // Basic match
    const basicMatch = safeIncludes(game.title, query) ||
                      safeIncludes(game.summary, query);
    
    if (basicMatch) return true;

    // Company match
    if (game.companies) {
      const developerMatch = game.companies.developer?.some(dev => 
        safeIncludes(dev, query)
      );
      const publisherMatch = game.companies.publisher?.some(pub => 
        safeIncludes(pub, query)
      );
      if (developerMatch || publisherMatch) return true;
    }

    // Platform match
    if (game.platforms?.some(platform => safeIncludes(platform, query))) {
      return true;
    }

    // Genre match
    if (game.genres?.some(genre => safeIncludes(genre, query))) {
      return true;
    }

    return false;
  });
}

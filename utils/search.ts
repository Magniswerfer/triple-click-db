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

    const basicMatch = 
      safeIncludes(episode.title, query) ||
      safeIncludes(episode.description, query) ||
      episode.episodeNumber?.toString().includes(query);
    
    if (basicMatch) return true;
    
    const gamesMatch = Array.isArray(episode.games) && episode.games.some(game => 
      game && safeIncludes(game.title, query)
    );
    
    if (gamesMatch) return true;
    
    const sectionsMatch = episode.sections && (
      safeIncludes(episode.sections.mainText, query) ||
      (episode.sections.oneMoreThing && (
        safeIncludes(episode.sections.oneMoreThing.kirk, query) ||
        safeIncludes(episode.sections.oneMoreThing.maddy, query) ||
        safeIncludes(episode.sections.oneMoreThing.jason, query)
      ))
    );
    
    return sectionsMatch;
  });
}

export function filterGames(games: Game[], searchQuery: string) {
  if (!searchQuery) return games;
  if (!Array.isArray(games)) return [];
  
  const query = searchQuery.toLowerCase();
  return games.filter((game) => {
    if (!game) return false;

    return (
      safeIncludes(game.title, query) ||
      safeIncludes(game.developer, query) ||
      safeIncludes(game.publisher, query) ||
      safeIncludes(game.description, query)
    );
  });
}


export type OneMoreThingCategory = "Game" | "Book" | "TV-Show" | "Movie" | "Podcast" | "Misc";

export interface OneMoreThingEntry {
  content: string;
  category: OneMoreThingCategory;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  sections: {
    mainText: string;
    oneMoreThing: {
      kirk: OneMoreThingEntry;
      maddy: OneMoreThingEntry;
      jason: OneMoreThingEntry;
    };
  };
  date: string;
  duration: string;
  audioUrl: string;
  episodeNumber: number;
  authors: string;
  explicit: boolean;
  type: "full" | "bonus";
  games: GameReference[];
}

export interface GameReference {
  id: string;      // Our internal ID
  title: string;   // Game title for quick reference
  igdbId: number;  // IGDB ID for future data updates
}

export interface Game {
  id: string;
  igdbId: number;
  title: string;
  summary?: string;
  cover?: {
    thumbnail: string; // Smaller image for lists/cards
    full: string;     // Larger image for game page
  };
  releaseDate?: Date;
  companies?: {
    developer: string[];
    publisher: string[];
  };
  platforms?: string[];
  genres?: string[];
  updatedAt: Date;
}

// IGDB API response types (partial, add more as needed)
export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: number;
  first_release_date?: number;
  involved_companies?: IGDBCompany[];
  platforms?: IGDBPlatform[];
  genres?: IGDBGenre[];
}

interface IGDBCompany {
  company: {
    id: number;
    name: string;
  };
  developer: boolean;
  publisher: boolean;
}

interface IGDBPlatform {
  id: number;
  name: string;
}

interface IGDBGenre {
  id: number;
  name: string;
}

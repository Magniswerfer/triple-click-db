export interface Episode {
  id: string;
  title: string;
  description: string;
  sections: {
    mainText: string;
    oneMoreThing: {
      kirk: string;
      maddy: string;
      jason: string;
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
  id: string;           // Our internal ID
  igdbId: number;      // IGDB ID
  title: string;       // Game title
  summary?: string;    // Game description
  cover?: string;      // Cover image URL
  releaseDate?: Date;  // Release date
  companies?: {        // Companies involved
    developer: string[];
    publisher: string[];
  };
  platforms?: string[]; // Platforms
  genres?: string[];    // Game genres
  updatedAt: Date;     // Last time we updated from IGDB
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

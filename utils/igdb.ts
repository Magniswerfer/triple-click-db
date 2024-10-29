// Load environment variables
const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID");
const TWITCH_CLIENT_SECRET = Deno.env.get("TWITCH_CLIENT_SECRET");

let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > new Date()) {
    return accessToken;
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  return accessToken;
}

async function igdbFetch(endpoint: string, query: string) {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": TWITCH_CLIENT_ID!,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: query
  });

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function searchGames(searchTerm: string) {
  const query = `
    search "${searchTerm}";
    fields id,name,summary,cover.*,first_release_date,
           involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
           platforms.name,genres.name;
    limit 10;
  `;
  
  return igdbFetch("games", query);
}

export async function getGameById(igdbId: number) {
  const query = `
    where id = ${igdbId};
    fields id,name,summary,cover.*,first_release_date,
           involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
           platforms.name,genres.name;
  `;
  
  const games = await igdbFetch("games", query);
  return games[0];
}

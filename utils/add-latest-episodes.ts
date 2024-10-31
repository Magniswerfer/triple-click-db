// utils/add-latest-episodes.ts
import { Episode } from "../types.ts";
import { parse as parseXML } from "@libs/xml";
import { kv } from "./db.ts";

function parseDescription(html: string): Episode['sections'] {
  // Split into paragraphs and clean up HTML
  const paragraphs = html
    .split('</p>')
    .map(p => p.replace(/<p>/g, '').trim())
    .filter(Boolean);

  const sections = {
    mainText: paragraphs[0],
    oneMoreThing: {
      kirk: {
        content: '',
        category: 'Misc' as const
      },
      maddy: {
        content: '',
        category: 'Misc' as const
      },
      jason: {
        content: '',
        category: 'Misc' as const
      }
    }
  };

  // Find "One More Thing" section
  const oneMoreThingIndex = paragraphs.findIndex(p => 
    p.includes('One More Thing')
  );

  // If we found the section and there are at least 3 more paragraphs
  if (oneMoreThingIndex !== -1 && oneMoreThingIndex + 3 < paragraphs.length) {
    // Get the next three paragraphs (recommendations)
    const recommendations = paragraphs.slice(oneMoreThingIndex + 1, oneMoreThingIndex + 4);
    
    recommendations.forEach(rec => {
      // Clean up the recommendation text
      const cleaned = rec.replace(/<\/?strong>/g, '').trim();
      
      // Parse each host's recommendation and attempt to determine category
      const parseRecommendation = (text: string) => {
        // Basic category detection - you might want to enhance this
        const lowerText = text.toLowerCase();
        let category = 'Misc' as const;
        
        if (lowerText.includes('playing') || lowerText.includes('game')) {
          category = 'Game';
        } else if (lowerText.includes('watching') || lowerText.includes('show')) {
          category = 'TV-Show';
        } else if (lowerText.includes('reading') || lowerText.includes('book')) {
          category = 'Book';
        } else if (lowerText.includes('listening') || lowerText.includes('podcast')) {
          category = 'Podcast';
        } else if (lowerText.includes('movie')) {
          category = 'Movie';
        }
        
        return { content: text, category };
      };

      if (cleaned.includes('Kirk:')) {
        const text = cleaned.split('Kirk:')[1].trim();
        sections.oneMoreThing.kirk = parseRecommendation(text);
      } else if (cleaned.includes('Maddy:')) {
        const text = cleaned.split('Maddy:')[1].trim();
        sections.oneMoreThing.maddy = parseRecommendation(text);
      } else if (cleaned.includes('Jason:')) {
        const text = cleaned.split('Jason:')[1].trim();
        sections.oneMoreThing.jason = parseRecommendation(text);
      }
    });
  }

  return sections;
}

async function getExistingEpisodeIds(): Promise<Set<string>> {
  const existingIds = new Set<string>();
  const episodes = kv.list({ prefix: ["episodes"] });
  for await (const entry of episodes) {
    const episode = entry.value as Episode;
    existingIds.add(episode.id);
  }
  return existingIds;
}

async function addLatestEpisodes(feedUrl = "https://feeds.simplecast.com/6WD3bDj7") {
  try {
    console.log(`\nFetching RSS feed from: ${feedUrl}`);
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const feed = parseXML(xmlText);
    const items = feed.rss.channel.item;
    
    // Get existing episode IDs
    const existingIds = await getExistingEpisodeIds();
    
    // Track new episodes
    let newEpisodesCount = 0;
    
    // Process items until we hit one we already have
    for (const item of items) {
      const episodeId = item.guid['#text'] || item.guid;
      
      // If we find an episode we already have, we can stop processing
      // since older episodes will also be in our database
      if (existingIds.has(episodeId)) {
        console.log('\nReached existing episode, stopping processing.');
        break;
      }
      
      // Only process full episodes
      if (item['itunes:episodeType'] === 'full') {
        const sections = parseDescription(item.description);
        
        const episode: Episode = {
          id: episodeId,
          title: item['itunes:title'] || item.title,
          description: item.description,
          sections,
          date: new Date(item.pubDate).toISOString(),
          duration: item['itunes:duration'] || '',
          audioUrl: item.enclosure?.url || '',
          episodeNumber: parseInt(item['itunes:episode']) || 0,
          authors: item['itunes:author'] || '',
          explicit: item['itunes:explicit'] === 'true',
          type: 'full',
          games: [] // Will need to be updated after adding the episode
        };
        
        await kv.set(["episodes", episode.id], episode);
        newEpisodesCount++;
        console.log(`Added new episode #${episode.episodeNumber}: ${episode.title}`);
      }
    }
    
    if (newEpisodesCount === 0) {
      console.log("\nNo new episodes found. Database is up to date!");
    } else {
      console.log(`\nSuccessfully added ${newEpisodesCount} new episodes`);
      console.log("\nNote: Don't forget to update the games array for the new episodes!");
    }
    
  } catch (error) {
    console.error("\nError processing RSS feed:");
    console.error(error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.main) {
  await addLatestEpisodes();
}

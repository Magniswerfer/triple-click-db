// scripts/add_new_episodes.ts
import { parse as parseXML } from "@libs/xml";
import { kv } from "../utils/db.ts";

interface Episode {
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
}

interface BonusContent {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  audioUrl: string;
  authors: string;
  explicit: boolean;
  type: "bonus";
}

function parseDescription(html: string): Episode['sections'] {
  // Split into paragraphs and clean up HTML
  const paragraphs = html
    .split('</p>')
    .map(p => p.replace(/<p>/g, '').trim())
    .filter(Boolean);

  const sections = {
    mainText: paragraphs[0],
    oneMoreThing: {
      kirk: '',
      maddy: '',
      jason: ''
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

      // Parse each host's recommendation
      if (cleaned.includes('Kirk:')) {
        sections.oneMoreThing.kirk = cleaned.split('Kirk:')[1].trim();
      } else if (cleaned.includes('Maddy:')) {
        sections.oneMoreThing.maddy = cleaned.split('Maddy:')[1].trim();
      } else if (cleaned.includes('Jason:')) {
        sections.oneMoreThing.jason = cleaned.split('Jason:')[1].trim();
      }
    });
  }

  return sections;
}

async function ingestFeed(feedUrl: string) {
  try {
    // Initialize counters
    let newEpisodeCount = 0;
    let newBonusCount = 0;
    let skippedCount = 0;
    let existingCount = 0;

    console.log(`\nFetching RSS feed from: ${feedUrl}`);
    const response = await fetch(feedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const feed = parseXML(xmlText);
    const items = feed.rss.channel.item;

    console.log(`Found ${items.length} total items in feed`);

    // Process each item
    for (const item of items) {
      const episodeType = item['itunes:episodeType'];
      const id = item.guid['#text'] || item.guid;

      // Check if episode already exists
      const existingEntry = await kv.get(episodeType === 'full' ? ["episodes", id] : ["bonus", id]);

      if (existingEntry.value) {
        existingCount++;
        continue;
      }

      if (episodeType === 'full') {
        // Process full episode
        const sections = parseDescription(item.description);

        const episode: Episode = {
          id,
          title: item['itunes:title'] || item.title,
          description: item.description,
          sections,
          date: new Date(item.pubDate).toISOString(),
          duration: item['itunes:duration'] || '',
          audioUrl: item.enclosure?.url || '',
          episodeNumber: parseInt(item['itunes:episode']) || 0,
          authors: item['itunes:author'] || '',
          explicit: item['itunes:explicit'] === 'true',
          type: 'full'
        };

        await kv.set(["episodes", episode.id], episode);
        newEpisodeCount++;
        console.log(`Added new Episode ${episode.episodeNumber}: ${episode.title}`);

      } else if (episodeType === 'bonus') {
        // Process bonus content
        const bonusContent: BonusContent = {
          id,
          title: item['itunes:title'] || item.title,
          description: item.description,
          date: new Date(item.pubDate).toISOString(),
          duration: item['itunes:duration'] || '',
          audioUrl: item.enclosure?.url || '',
          authors: item['itunes:author'] || '',
          explicit: item['itunes:explicit'] === 'true',
          type: 'bonus'
        };

        await kv.set(["bonus", bonusContent.id], bonusContent);
        newBonusCount++;
        console.log(`Added new Bonus: ${bonusContent.title}`);

      } else {
        // Skip other types
        skippedCount++;
        console.log(`Skipped item: ${item.title} (type: ${episodeType})`);
      }
    }

    // Print summary
    console.log("\nIngestion Complete:");
    console.log("------------------");
    console.log(`New Episodes Added: ${newEpisodeCount}`);
    console.log(`New Bonus Content Added: ${newBonusCount}`);
    console.log(`Already Existing: ${existingCount}`);
    console.log(`Skipped Items: ${skippedCount}`);
    console.log(`Total Processed: ${newEpisodeCount + newBonusCount + existingCount + skippedCount}`);

  } catch (error) {
    console.error("\nError processing RSS feed:");
    console.error(error);
    throw error;
  }
}

// Script entry point
if (import.meta.main) {
  const FEED_URL = "https://feeds.simplecast.com/6WD3bDj7";
  await ingestFeed(FEED_URL);
}

// scripts/migrate-one-more-thing.ts
import { kv } from "../utils/db.ts";
import { Episode } from "../types.ts";

async function migrateOneMoreThing() {
  const entries = await kv.list<Episode>({ prefix: ["episodes"] });
  
  for await (const entry of entries) {
    const episode = entry.value;
    
    // Convert existing string entries to objects with category
    const updatedOneMoreThing = {
      kirk: {
        content: episode.sections.oneMoreThing.kirk,
        category: "Misc" as const
      },
      maddy: {
        content: episode.sections.oneMoreThing.maddy,
        category: "Misc" as const
      },
      jason: {
        content: episode.sections.oneMoreThing.jason,
        category: "Misc" as const
      }
    };
    
    // Update the episode with new structure
    const updatedEpisode = {
      ...episode,
      sections: {
        ...episode.sections,
        oneMoreThing: updatedOneMoreThing
      }
    };
    
    // Save the updated episode
    await kv.set(["episodes", episode.id], updatedEpisode);
  }
  
  console.log("Migration completed successfully");
}

// Run the migration
if (import.meta.main) {
  await migrateOneMoreThing();
  Deno.exit(0);
}

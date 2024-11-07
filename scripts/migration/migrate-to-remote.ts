// scripts/migrate-to-remote.ts
import "$std/dotenv/load.ts";

async function migrateToRemote() {
  try {
    // Connect to both databases
    console.log("Connecting to databases...");
    const localKv = await Deno.openKv();  // Local database
    const remoteUrl = Deno.env.get("DENO_KV_URL");
    
    if (!remoteUrl) {
      throw new Error("DENO_KV_URL not set in environment");
    }
    
    const remoteKv = await Deno.openKv(remoteUrl);
    console.log("Connected to both databases");

    // Migrate all data
    let count = 0;
    console.log("\nStarting migration...");

    // First, let's see what we're migrating
    const entries = [];
    for await (const entry of localKv.list({ prefix: [] })) {
      entries.push({
        key: entry.key,
        value: entry.value,
      });
    }
    
    console.log(`Found ${entries.length} entries to migrate`);
    
    // Now migrate each entry
    for (const entry of entries) {
      console.log(`Migrating: ${entry.key.join("/")}`);
      await remoteKv.set(entry.key, entry.value);
      count++;
      
      if (count % 10 === 0) {
        console.log(`Migrated ${count}/${entries.length} entries...`);
      }
    }

    console.log("\nVerifying migration...");
    let remoteCount = 0;
    for await (const _ of remoteKv.list({ prefix: [] })) {
      remoteCount++;
    }
    
    console.log(`\nMigration complete!`);
    console.log(`- Local entries: ${entries.length}`);
    console.log(`- Remote entries: ${remoteCount}`);
    
    // Close connections
    await localKv.close();
    await remoteKv.close();
    
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await migrateToRemote();
}

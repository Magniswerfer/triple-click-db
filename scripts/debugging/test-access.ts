// scripts/test-access.ts
import { Episode } from "../types.ts";

async function testDatabaseAccess() {
  try {
    const url = Deno.env.get("DENO_KV_URL");
    console.log("Using KV URL:", url);
    
    // Method 1: Direct connection (like inspect-kv)
    console.log("\nTesting direct connection:");
    const directKv = await Deno.openKv(url);
    let count = 0;
    for await (const entry of directKv.list({ prefix: ["episodes"] })) {
      count++;
      console.log("Direct access found:", entry.key, entry.value);
    }
    console.log(`Direct access found ${count} entries`);
    
    // Method 2: Through the db.ts import (like your app)
    console.log("\nTesting through db.ts import:");
    const { kv } = await import("../utils/db.ts");
    const episodeEntries = await kv.list<Episode>({ prefix: ["episodes"] });
    let importCount = 0;
    for await (const entry of episodeEntries) {
      importCount++;
      console.log("Import access found:", entry.key, entry.value);
    }
    console.log(`Import access found ${importCount} entries`);
    
    // Close connections
    await directKv.close();
    await kv.close();
  } catch (error) {
    console.error("Error during test:", error);
  }
}

if (import.meta.main) {
  await testDatabaseAccess();
}

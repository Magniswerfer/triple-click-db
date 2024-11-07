// scripts/debug-connection.ts
async function debugConnection() {
  try {
    console.log("1. Checking environment variables...");
    const url = Deno.env.get("DENO_KV_URL");
    const token = Deno.env.get("DENO_KV_ACCESS_TOKEN");
    
    console.log("KV URL present:", !!url);
    console.log("Access token present:", !!token);
    
    console.log("\n2. Attempting database connection...");
    const kv = await Deno.openKv(url);
    console.log("Connection successful!");
    
    console.log("\n3. Attempting to read episodes...");
    const episodes = [];
    for await (const entry of kv.list({ prefix: ["episodes"] })) {
      episodes.push(entry);
    }
    console.log(`Found ${episodes.length} episodes:`);
    episodes.forEach(ep => console.log("-", ep.value));
    
    await kv.close();
  } catch (error) {
    console.error("\nError occurred:", error.message);
    console.error("\nFull error:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await debugConnection();
}


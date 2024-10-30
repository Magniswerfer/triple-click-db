// scripts/inspect-kv.ts
async function inspectDatabase(isRemote = false) {
  try {
    // Connect to either local or remote database
    const kv = isRemote 
      ? await Deno.openKv(Deno.env.get("DENO_KV_URL")!)
      : await Deno.openKv();
    
    console.log(`Inspecting ${isRemote ? 'remote' : 'local'} database:\n`);
    
    const entries = [];
    let count = 0;
    
    // Get all entries and group them by prefix
    for await (const entry of kv.list({ prefix: [] })) {
      entries.push({
        key: entry.key,
        value: entry.value,
        versionstamp: entry.versionstamp
      });
      count++;
    }
    
    // Group entries by their first key component
    const grouped = entries.reduce((acc, entry) => {
      const prefix = entry.key[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(entry);
      return acc;
    }, {} as Record<string, typeof entries>);
    
    // Print grouped entries
    for (const [prefix, prefixEntries] of Object.entries(grouped)) {
      console.log(`\n=== ${prefix} (${prefixEntries.length} entries) ===`);
      for (const entry of prefixEntries) {
        console.log('\nKey:', entry.key);
        console.log('Value:', JSON.stringify(entry.value, null, 2));
      }
    }
    
    console.log(`\nTotal entries: ${count}`);
    await kv.close();
  } catch (error) {
    console.error("Inspection failed:", error.message);
    Deno.exit(1);
  }
}

// If run directly, inspect local database by default
if (import.meta.main) {
  const isRemote = Deno.args.includes('--remote');
  await inspectDatabase(isRemote);
}

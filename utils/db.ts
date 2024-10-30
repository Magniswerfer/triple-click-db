const url = Deno.env.get("DENO_KV_URL");
if (!url) {
  throw new Error("DENO_KV_URL environment variable is not set");
}

export const kv = await Deno.openKv(url);

// Optional: Close KV on process exit
globalThis.addEventListener("unload", () => {
  kv.close();
});


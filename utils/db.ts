import "$std/dotenv/load.ts";

const isDeploy = Deno.env.has("DENO_DEPLOYMENT_ID");
const url = isDeploy 
  ? "https://api.deno.com/databases/fa5b123c-7c5f-4dcc-8669-db5d041d2061/connect"  // Your database URL
  : Deno.env.get("DENO_KV_URL");

if (!url) {
  throw new Error("DENO_KV_URL environment variable is not set");
}

export const kv = await Deno.openKv(url);

// Optional: Close KV on process exit
globalThis.addEventListener("unload", () => {
  kv.close();
});

import "$std/dotenv/load.ts";

// For local development, use the remote URL
// For Deno Deploy, don't specify a URL at all
const isDeploy = Deno.env.has("DENO_DEPLOYMENT_ID");
export const kv = await Deno.openKv(isDeploy ? undefined : Deno.env.get("DENO_KV_URL"));

// Optional: Close KV on process exit
globalThis.addEventListener("unload", () => {
  kv.close();
});

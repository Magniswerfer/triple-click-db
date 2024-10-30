// utils/kv.ts
export async function getKv() {
  const url = Deno.env.get("DENO_KV_URL");
  if (!url) {
    throw new Error("DENO_KV_URL environment variable is not set");
  }
  return await Deno.openKv(url);
}

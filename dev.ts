#!/usr/bin/env -S deno run -A --watch=static/,routes/
import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";
import "$std/dotenv/load.ts";

// Add these debug lines
console.log("Environment check on startup:");
console.log("KV URL:", !!Deno.env.get("DENO_KV_URL"));
console.log("KV Token:", !!Deno.env.get("DENO_KV_ACCESS_TOKEN"));

await dev(import.meta.url, "./main.ts", config);

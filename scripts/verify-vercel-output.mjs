import { existsSync, readFileSync } from "node:fs";

if (process.env.NITRO_PRESET !== "vercel" && !process.env.VERCEL) {
  console.log("Skipping Vercel Build Output check for non-Vercel build.");
  process.exit(0);
}

const required = [
  ".vercel/output/config.json",
  ".vercel/output/functions/__server.func/index.mjs",
  ".vercel/output/functions/__server.func/.vc-config.json",
  ".vercel/output/static",
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error(`Missing Vercel Build Output files:\n${missing.map((p) => `- ${p}`).join("\n")}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(".vercel/output/config.json", "utf8"));
const routes = Array.isArray(config.routes) ? config.routes : [];
const hasServerFallback = routes.some(
  (route) => route?.src === "/(.*)" && route?.dest === "/__server",
);
if (!hasServerFallback) {
  console.error("Vercel output is missing the catch-all route to /__server.");
  process.exit(1);
}

console.log("Vercel Build Output looks valid.");

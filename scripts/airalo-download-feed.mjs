#!/usr/bin/env node
/**
 * Download Airalo product feed for local catalog parsing.
 * Set AIRALO_FEED_URL in .env.local (from Travelpayouts Airalo program tools).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const feedUrl = process.env.AIRALO_FEED_URL?.trim();
const outputPath = path.resolve(
  root,
  process.env.AIRALO_FEED_PATH?.trim() || "data/feeds/airalo-feed.xml"
);

if (!feedUrl) {
  console.error("AIRALO_FEED_URL is not set. Download the feed URL from Travelpayouts Airalo tools.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const response = await fetch(feedUrl);
if (!response.ok) {
  console.error(`Feed download failed (${response.status})`);
  process.exit(1);
}

const xml = await response.text();
fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Saved Airalo feed to ${outputPath} (${xml.length} bytes)`);

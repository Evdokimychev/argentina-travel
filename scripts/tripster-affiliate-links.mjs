#!/usr/bin/env node
/**
 * Backfill missing Travelpayouts partner_url for synced experiences (rate-limited).
 * Usage: npm run tripster:affiliate-links
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPgClientFromEnv } from "./tripster-db-pg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const DELAY_MS = Number.parseInt(process.env.TRIPSTER_AFFILIATE_DELAY_MS ?? "700", 10);

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
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
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPartnerLink(link) {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY?.trim();
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  const trs = process.env.TRAVELPAYOUTS_TRS?.trim();
  if (!apiKey || !marker || !trs) {
    throw new Error("Travelpayouts env incomplete");
  }

  const response = await fetch("https://api.travelpayouts.com/links/v1/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": apiKey,
    },
    body: JSON.stringify({
      trs: Number(trs),
      marker: Number(marker),
      shorten: process.env.TRAVELPAYOUTS_SHORTEN_LINKS === "true",
      links: [link],
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.result?.links?.[0]) {
    const detail = body?.error || body?.result?.links?.[0]?.message || response.status;
    throw new Error(String(detail));
  }

  return body.result.links[0];
}

async function main() {
  loadEnvLocal();
  const client = await createPgClientFromEnv();

  const { rows } = await client.query(
    `select e.id, e.slug, e.tripster_url, c.slug as city_slug
     from public.tripster_experiences e
     left join public.tripster_cities c on c.id = e.city_id
     where e.partner_url is null or trim(e.partner_url) = ''
     order by e.id`
  );

  console.log(`Experiences without partner_url: ${rows.length}`);
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await createPartnerLink({
        url: row.tripster_url,
        sub_id: `tripster:${row.city_slug ?? "city"}:${row.id}`,
      });
      const partnerUrl = result.partner_url?.trim() || result.url?.trim();
      if (!partnerUrl) throw new Error("empty partner url");

      await client.query(
        `update public.tripster_experiences set partner_url = $2, updated_at = now() where id = $1`,
        [row.id, partnerUrl]
      );
      updated += 1;
      console.log(`ok #${row.id} ${row.slug}`);
    } catch (error) {
      failed += 1;
      console.warn(`skip #${row.id}: ${error.message ?? error}`);
    }

    await sleep(DELAY_MS);
  }

  await client.end();
  console.log(`Done. Updated: ${updated}, failed: ${failed}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

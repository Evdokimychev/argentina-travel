#!/usr/bin/env node
/**
 * Probe Tripster partner API for accommodation-related fields on a tour.
 * Usage: node --env-file=.env.local scripts/tripster-probe-accommodation.mjs 109207
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const id = Number(process.argv[2] || 109207);

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

async function obtainToken(apiBase, partner, secret) {
  const response = await fetch(`${apiBase}/auth/obtain_token/partner/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner, secret }),
  });
  const body = await response.json();
  if (!response.ok || !body?.token) {
    throw new Error(`Auth failed (${response.status})`);
  }
  return body.token;
}

async function tripsterGet(apiBase, partner, token, resourcePath) {
  const response = await fetch(
    `${apiBase}/partners/${encodeURIComponent(partner)}${resourcePath}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 500) };
  }
  return { ok: response.ok, status: response.status, body };
}

loadEnvLocal();

const partner = process.env.TRIPSTER_PARTNER?.trim();
const secret = process.env.TRIPSTER_SECRET?.trim();
const apiBase = (process.env.TRIPSTER_API_BASE?.trim() || "https://experience.tripster.ru/api").replace(/\/$/, "");

if (!partner || !secret) {
  console.error("Missing TRIPSTER_PARTNER / TRIPSTER_SECRET");
  process.exit(1);
}

const token = await obtainToken(apiBase, partner, secret);

const paths = [
  `/experiences/${id}/?detailed=true&price_format=detailed`,
  `/experiences/${id}/plan/`,
  `/experiences/${id}/accommodation/`,
  `/experiences/${id}/accommodations/`,
  `/experiences/${id}/lodging/`,
  `/experiences/${id}/comfort/`,
  `/experiences/${id}/comfort_level/`,
  `/experiences/${id}/hotels/`,
];

const out = { id, paths: {} };

for (const p of paths) {
  const result = await tripsterGet(apiBase, partner, token, p);
  out.paths[p] = {
    status: result.status,
    ok: result.ok,
    keys: result.body && typeof result.body === "object" ? Object.keys(result.body) : [],
    sample: JSON.stringify(result.body)?.slice(0, 2500),
  };
}

const full = (await tripsterGet(apiBase, partner, token, `/experiences/${id}/?detailed=true&price_format=detailed`)).body;
out.accommodationRelated = {};
for (const [k, v] of Object.entries(full)) {
  if (/acc|comfort|lodg|hotel|room|stay/i.test(k)) {
    out.accommodationRelated[k] = v;
  }
}
if (full.description_blocks) {
  out.descriptionBlockTitles = full.description_blocks.map((b) => b[0]);
}
out.descriptionBlocks = (full.description_blocks ?? []).map(([title, html]) => ({
  title,
  htmlLength: String(html ?? "").length,
  htmlPreview: String(html ?? "").slice(0, 400),
}));
out.priceIncludedPreview = String(full.price_included_description ?? "").slice(0, 500);
out.priceExcludedPreview = String(full.price_not_included_description ?? "").slice(0, 500);

const webPaths = [
  `${apiBase}/web/v2/experiences/${id}/`,
  `${apiBase}/web/v2/experiences/${id}/accommodation/`,
];

for (const url of webPaths) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 300) };
  }
  out.webPaths ??= {};
  out.webPaths[url] = {
    status: response.status,
    ok: response.ok,
    keys: body && typeof body === "object" ? Object.keys(body) : [],
    accommodation: body?.accommodation ?? null,
    comfortLen: typeof body?.comfort_level_info === "string" ? body.comfort_level_info.length : 0,
    descriptionLen: typeof body?.description === "string" ? body.description.length : 0,
    descriptionPreview:
      typeof body?.description === "string" ? body.description.slice(0, 400) : undefined,
  };
}

const outPath = path.join(root, "docs/tripster-accommodation-probe.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("Wrote", outPath);

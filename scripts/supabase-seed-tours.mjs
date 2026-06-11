#!/usr/bin/env node
/**
 * Seed marketplace tours into Supabase via admin API.
 * Usage: npm run supabase:seed-tours
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found. Copy .env.example and fill in values.");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const token = process.env.LEADS_ADMIN_TOKEN?.trim();
  if (!token) {
    throw new Error("LEADS_ADMIN_TOKEN is missing in .env.local");
  }

  const port = process.env.PORT?.trim() || "3000";
  const baseUrl = process.env.SEED_BASE_URL?.trim() || `http://localhost:${port}`;

  const response = await fetch(`${baseUrl}/api/admin/tours/seed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Seed failed (${response.status})`);
  }

  console.log(`Seeded ${body.seeded}/${body.total} tours`);
  if (body.errors?.length) {
    console.warn("Errors:", body.errors);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

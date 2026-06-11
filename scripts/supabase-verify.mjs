#!/usr/bin/env node
/**
 * Smoke-test lead capture API + Supabase inserts.
 * Usage: npm run supabase:verify  (dev server must be running on :3000)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

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

async function postJson(pathname, body) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function main() {
  loadEnvLocal();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_* in .env.local");
  }

  const stamp = Date.now();
  const email = `smoke-${stamp}@example.com`;

  console.log("Testing newsletter…");
  const newsletter = await postJson("/api/newsletter", {
    email,
    source: "smoke-test",
  });
  console.log("  →", newsletter.status, newsletter.json);

  console.log("Testing contact…");
  const contact = await postJson("/api/contact", {
    name: "Smoke Test",
    email,
    message: `Phase 0 verification ${stamp}`,
    kind: "general",
  });
  console.log("  →", contact.status, contact.json);

  const ok = newsletter.status === 200 && contact.status === 200;
  if (!ok) {
    process.exitCode = 1;
    console.error("Verification failed.");
  } else {
    console.log("Verification passed. Check rows in Supabase Dashboard.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * CI helper: start production server, run Lighthouse blog CWV audit, stop server.
 *
 * Usage (after npm run build):
 *   node scripts/lighthouse-ci.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 90_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < START_TIMEOUT_MS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(1500);
  }
  return false;
}

const server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
  cwd: root,
  stdio: "ignore",
  env: { ...process.env, PORT: String(PORT) },
});

let auditStatus = 1;

try {
  const ready = await waitForServer(`${BASE_URL}/blog`);
  if (!ready) {
    console.error(`Server did not become ready at ${BASE_URL}/blog within ${START_TIMEOUT_MS}ms`);
    process.exit(1);
  }

  const audit = spawn("node", ["scripts/lighthouse-blog-cwv.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: BASE_URL,
      LIGHTHOUSE_SAMPLE_PATHS: process.env.LIGHTHOUSE_SAMPLE_PATHS ?? "/blog,/blog/patagonia-packing-list,/blog/natsionalnyy-park-iguasu",
    },
  });

  auditStatus = await new Promise((resolve) => {
    audit.on("close", (code) => resolve(code ?? 1));
  });
} finally {
  server.kill("SIGTERM");
}

process.exit(auditStatus);

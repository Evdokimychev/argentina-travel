#!/usr/bin/env node
/**
 * CI helper: start production server, run Lighthouse blog CWV audit, stop server.
 *
 * Usage (after npm run build):
 *   node scripts/lighthouse-ci.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = Number(process.env.LIGHTHOUSE_START_TIMEOUT_MS ?? 180_000);
const PROBE_PATHS = (process.env.LIGHTHOUSE_PROBE_PATHS ?? "/,/blog")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < START_TIMEOUT_MS) {
    for (const probePath of PROBE_PATHS) {
      const ready = await probeUrl(`${BASE_URL}${probePath.startsWith("/") ? probePath : `/${probePath}`}`);
      if (ready) return true;
    }
    await sleep(2000);
  }
  return false;
}

const server = spawn("npx", ["next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
  },
});

let serverLog = "";
server.stdout?.on("data", (chunk) => {
  serverLog += chunk.toString();
  if (serverLog.length > 12_000) serverLog = serverLog.slice(-12_000);
});
server.stderr?.on("data", (chunk) => {
  serverLog += chunk.toString();
  if (serverLog.length > 12_000) serverLog = serverLog.slice(-12_000);
});

let auditStatus = 1;

try {
  const ready = await waitForServer();
  if (!ready) {
    console.error(
      `Server did not become ready at ${BASE_URL} (${PROBE_PATHS.join(", ")}) within ${START_TIMEOUT_MS}ms`,
    );
    if (serverLog.trim()) {
      console.error("--- next start log (tail) ---");
      console.error(serverLog.trim());
    }
    process.exit(1);
  }

  const audit = spawn("node", ["scripts/lighthouse-blog-cwv.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: BASE_URL,
      LIGHTHOUSE_SAMPLE_PATHS:
        process.env.LIGHTHOUSE_SAMPLE_PATHS ??
        "/blog,/blog/patagonia-packing-list,/blog/natsionalnyy-park-iguasu",
    },
  });

  auditStatus = await new Promise((resolve) => {
    audit.on("close", (code) => resolve(code ?? 1));
  });
} finally {
  server.kill("SIGTERM");
  await sleep(500);
  if (!server.killed) server.kill("SIGKILL");
}

process.exit(auditStatus);

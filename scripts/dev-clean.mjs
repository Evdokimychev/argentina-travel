#!/usr/bin/env node
/**
 * Stop stale Next.js on PORT (default 3000), clear .next, start dev server.
 * Usage: npm run dev:clean
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = process.env.PORT?.trim() || "3000";

function killPort(targetPort) {
  try {
    const pids = execSync(`lsof -ti tcp:${targetPort}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* already gone */
      }
    }
    if (pids.length > 0) {
      console.log(`Stopped process(es) on port ${targetPort}: ${pids.join(", ")}`);
    }
  } catch {
    /* nothing listening */
  }
}

killPort(port);

const nextDir = path.join(root, ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
}

console.log(`Starting Next.js dev on http://localhost:${port} …`);

const child = spawn("npx", ["next", "dev", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

child.on("exit", (code) => process.exit(code ?? 0));

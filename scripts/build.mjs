#!/usr/bin/env node
/**
 * Safe production build:
 * - stops running Next.js dev servers for this repo
 * - clears .next to avoid mixed dev/production artifacts
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  killPorts,
  killProjectNextDev,
  removeDevLock,
  removeNextCache,
} from "./dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isCiBuild = Boolean(process.env.VERCEL || process.env.CI);

let killedNext = [];
let killedByPort = new Map();

if (!isCiBuild) {
  killedNext = killProjectNextDev(root);
  killedByPort = killPorts(["3000", "3001", "3002", "3003"]);
}

if (killedNext.length > 0) {
  console.log(`Stopped Next.js dev process(es) before build: ${killedNext.join(", ")}`);
}

const killedPortCount = [...killedByPort.values()].reduce((sum, pids) => sum + pids.length, 0);
if (killedPortCount > 0) {
  const summary = [...killedByPort.entries()]
    .map(([p, ids]) => `${p}:${ids.join(",")}`)
    .join("; ");
  console.log(`Freed dev port(s): ${summary}`);
}

removeDevLock(root);

if (removeNextCache(root)) {
  console.log("Removed .next cache before production build");
}

console.log("Running next build …");

const meta = spawn("node", ["scripts/write-migration-meta.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

meta.on("exit", (metaCode) => {
  if (metaCode !== 0) {
    process.exit(metaCode ?? 1);
  }

  const child = spawn("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
});

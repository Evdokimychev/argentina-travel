#!/usr/bin/env node
/**
 * Safe Next.js dev starter:
 * - stops other dev servers for this repo (prevents corrupted .next chunks)
 * - clears .next when a conflict or stale lock is detected
 * - `npm run dev:clean` passes --clean to always wipe .next first
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  killPorts,
  killProjectNextDev,
  isNextCacheCorrupted,
  readStaleDevLock,
  removeDevLock,
  removeNextCache,
  writeDevLock,
} from "./dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const forceClean = process.argv.includes("--clean");
const port = process.env.PORT?.trim() || "3000";

const killedNext = killProjectNextDev(root);
const killedByPort = killPorts(["3000", "3001", "3002", "3003"]);
const killedPortCount = [...killedByPort.values()].reduce((sum, pids) => sum + pids.length, 0);
const lockState = readStaleDevLock(root);

let killedLockHolder = false;
if (lockState && !lockState.stale && lockState.lock?.pid && lockState.lock.pid !== process.pid) {
  try {
    process.kill(lockState.lock.pid, "SIGTERM");
    killedLockHolder = true;
    console.log(`Stopped dev lock holder pid ${lockState.lock.pid}`);
  } catch {
    /* process already gone */
  }
}

const hadConflict = killedNext.length > 0 || killedPortCount > 0 || killedLockHolder;
const staleLock = lockState?.stale === true;
const cacheCorrupted = isNextCacheCorrupted(root);

if (killedNext.length > 0) {
  console.log(`Stopped other Next.js dev process(es) for this project: ${killedNext.join(", ")}`);
}

if (killedPortCount > 0) {
  const summary = [...killedByPort.entries()]
    .map(([p, ids]) => `${p}:${ids.join(",")}`)
    .join("; ");
  console.log(`Freed dev port(s): ${summary}`);
}

if (forceClean || hadConflict || staleLock || cacheCorrupted) {
  if (removeNextCache(root)) {
    const reason = forceClean
      ? "dev:clean requested"
      : hadConflict
        ? "parallel dev server conflict"
        : cacheCorrupted
          ? "corrupted .next cache"
          : "stale dev lock";
    console.log(`Removed .next cache (${reason})`);
  } else if (fs.existsSync(path.join(root, ".next"))) {
    console.warn("Warning: could not fully remove .next — stop other dev servers and retry npm run dev:clean");
  }
}

removeDevLock(root);

console.log(`Starting Next.js dev on http://localhost:${port} …`);

const child = spawn("npx", ["next", "dev", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

writeDevLock(root, port);

function cleanup() {
  removeDevLock(root);
}

child.on("exit", (code) => {
  cleanup();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  cleanup();
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  cleanup();
  child.kill("SIGTERM");
});

process.on("exit", cleanup);

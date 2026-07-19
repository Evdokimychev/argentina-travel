#!/usr/bin/env node
/** Start the production bundle without allowing a parallel dev server to mutate .next. */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  killPorts,
  killProjectNextDev,
  readProductionBuildLock,
  removeProductionBuildLock,
  writeProductionBuildLock,
} from "./dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
if (!process.env.NEXT_DIST_DIR?.trim()) {
  process.env.NEXT_DIST_DIR = process.env.CI ? ".next" : ".next-production";
}
const existingLock = readProductionBuildLock(root);

if (existingLock && !existingLock.stale) {
  throw new Error(`Production build or preview is already running (pid ${existingLock.lock.pid})`);
}
if (existingLock?.stale) {
  removeProductionBuildLock(root, existingLock.lock?.pid);
}

writeProductionBuildLock(root);
killProjectNextDev(root);

function cleanup() {
  removeProductionBuildLock(root);
}

process.on("exit", cleanup);

const args = process.argv.slice(2);
const buildRequested = args.includes("--build");
const nextArgs = args.filter((arg) => arg !== "--build");

function run(command, commandArgs, env = process.env) {
  return new Promise((resolve, reject) => {
    const processChild = spawn(command, commandArgs, {
      cwd: root,
      stdio: "inherit",
      env,
    });
    processChild.once("error", reject);
    processChild.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code ?? 1}`));
    });
  });
}

if (buildRequested) {
  await run(process.execPath, ["scripts/build.mjs"], {
    ...process.env,
    PRODUCTION_LOCK_OWNER_PID: String(process.pid),
  });
}

// An IDE may have restarted `next dev` while the long production build ran.
// Stop it again immediately before binding the preview port.
killProjectNextDev(root);
const portIndex = nextArgs.findIndex((arg) => arg === "-p" || arg === "--port");
const previewPort = portIndex >= 0 ? nextArgs[portIndex + 1] : process.env.PORT || "3000";
killPorts([previewPort]);

const child = spawn("npx", ["next", "start", ...nextArgs], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

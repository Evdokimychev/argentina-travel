#!/usr/bin/env node
/**
 * Local Next production-server lifecycle helpers for Lighthouse CI.
 * Restarts the candidate server when a hung Chrome gather OOMs / kills it.
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  killPort,
  readProductionBuildLock,
  removeProductionBuildLock,
} from "./dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseLocalPort(baseUrl, fallback = 3000) {
  try {
    const url = new URL(baseUrl);
    if (url.port) return Number(url.port);
    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return fallback;
  }
}

export async function waitForLocalUrl(url, timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
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

export function stopManagedServer(server, port) {
  if (server?.pid) {
    try {
      process.kill(server.pid, "SIGTERM");
    } catch {
      // already gone
    }
    try {
      process.kill(server.pid, "SIGKILL");
    } catch {
      // already gone
    }
  }
  if (Number.isInteger(port) && port > 0) killPort(port);
  const lock = readProductionBuildLock(root);
  if (lock) removeProductionBuildLock(root, lock.lock?.pid);
}

export async function startManagedServer(port, env = process.env) {
  stopManagedServer(null, port);
  await sleep(1000);

  const server = spawn("npm", ["run", "start", "--", "-p", String(port)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...env, PORT: String(port) },
    detached: false,
  });

  let log = "";
  server.stdout?.on("data", (chunk) => {
    log = `${log}${chunk.toString()}`.slice(-8_000);
  });
  server.stderr?.on("data", (chunk) => {
    log = `${log}${chunk.toString()}`.slice(-8_000);
  });
  server.on("exit", (code, signal) => {
    server.exitCode = code;
    server.exitSignal = signal;
  });

  const ready = await waitForLocalUrl(`http://127.0.0.1:${port}/`);
  if (!ready) {
    stopManagedServer(server, port);
    const probe = spawnSync(
      process.execPath,
      ["-e", "process.exit(0)"],
      { stdio: "ignore" },
    );
    void probe;
    const error = new Error(
      `Managed Next server failed to become ready on :${port}\n${log.trim()}`,
    );
    error.serverLog = log;
    throw error;
  }

  return server;
}

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PORTS = ["3000", "3001", "3002", "3003"];

export function killPort(targetPort) {
  const killed = [];
  try {
    const pids = execSync(`lsof -ti tcp:${targetPort}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
        killed.push(Number(pid));
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
  return killed;
}

export function killPorts(ports = DEFAULT_PORTS) {
  const killedByPort = new Map();
  for (const port of ports) {
    const pids = killPort(port);
    if (pids.length > 0) killedByPort.set(port, pids);
  }
  return killedByPort;
}

function processCwd(pid) {
  try {
    const out = execSync(`lsof -a -p ${pid} -d cwd -Fn`, { encoding: "utf8" }).trim();
    const line = out.split("\n").find((entry) => entry.startsWith("n"));
    return line ? line.slice(1) : null;
  } catch {
    return null;
  }
}

function processCommand(pid) {
  try {
    return execSync(`ps -p ${pid} -o command=`, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/** Stop other `next dev` processes started from this repo (any port). */
export function killProjectNextDev(root) {
  const killed = [];
  let candidates = [];

  try {
    candidates = execSync('pgrep -fl "next dev"', { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return killed;
  }

  for (const line of candidates) {
    const match = line.match(/^(\d+)\s+/);
    if (!match) continue;

    const pid = Number(match[1]);
    if (pid === process.pid) continue;

    const cwd = processCwd(pid);
    const command = processCommand(pid) ?? line;
    const sameProject =
      cwd === root ||
      command.includes(root) ||
      (cwd != null && path.resolve(cwd) === path.resolve(root));

    if (!sameProject) continue;

    try {
      process.kill(pid, "SIGTERM");
      killed.push(pid);
    } catch {
      /* already gone */
    }
  }

  return killed;
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy wait — dev-utils stays sync */
  }
}

export function removeNextCache(root) {
  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) return false;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      if (!fs.existsSync(nextDir)) return true;
    } catch {
      /* retry below */
    }

    const trashDir = path.join(root, `.next-trash-${Date.now()}-${attempt}`);
    try {
      if (fs.existsSync(nextDir)) {
        fs.renameSync(nextDir, trashDir);
        fs.rmSync(trashDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
        if (!fs.existsSync(nextDir) && !fs.existsSync(trashDir)) return true;
      }
    } catch {
      try {
        if (fs.existsSync(trashDir)) {
          fs.rmSync(trashDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
      } catch {
        /* keep retrying primary dir */
      }
    }

    sleepMs(250 + attempt * 100);
  }

  return !fs.existsSync(nextDir);
}

const VENDOR_CHUNK_PATTERN = /\.\/vendor-chunks\/([^'"\s]+)/g;
const NUMERIC_CHUNK_PATTERN = /\.\/(\d+)\.js/g;

function referencesMissingChunks(filePath, serverDir, vendorDir) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return false;
  }

  for (const match of content.matchAll(VENDOR_CHUNK_PATTERN)) {
    const chunkFile = path.join(vendorDir, match[1]);
    if (!fs.existsSync(chunkFile)) return true;
  }

  for (const match of content.matchAll(NUMERIC_CHUNK_PATTERN)) {
    const chunkFile = path.join(serverDir, `${match[1]}.js`);
    if (!fs.existsSync(chunkFile)) return true;
  }

  return false;
}

/** Detect stale webpack refs like missing vendor-chunks or numeric chunk files. */
export function isNextCacheCorrupted(root) {
  const nextDir = path.join(root, ".next");
  const serverDir = path.join(nextDir, "server");
  if (!fs.existsSync(serverDir)) return false;

  const vendorDir = path.join(serverDir, "vendor-chunks");
  const webpackRuntime = path.join(serverDir, "webpack-runtime.js");

  if (fs.existsSync(webpackRuntime) && referencesMissingChunks(webpackRuntime, serverDir, vendorDir)) {
    return true;
  }

  const prerenderManifest = path.join(nextDir, "prerender-manifest.json");
  const fallbackManifest = path.join(nextDir, "fallback-build-manifest.json");
  const manifestFiles = [
    prerenderManifest,
    path.join(nextDir, "routes-manifest.json"),
    path.join(nextDir, "build-manifest.json"),
    fallbackManifest,
  ];
  const hasAnyManifest = manifestFiles.some((file) => fs.existsSync(file));
  const appDir = path.join(serverDir, "app");

  if (fs.existsSync(appDir) && !hasAnyManifest) {
    return true;
  }

  // Dev server still running while .next was partially deleted (e.g. parallel build)
  if (fs.existsSync(webpackRuntime) && !fs.existsSync(prerenderManifest) && !fs.existsSync(fallbackManifest)) {
    return true;
  }

  const priorityFiles = [
    webpackRuntime,
    path.join(serverDir, "pages/_document.js"),
  ];

  if (priorityFiles.some((file) => fs.existsSync(file) && referencesMissingChunks(file, serverDir, vendorDir))) {
    return true;
  }

  if (!fs.existsSync(appDir)) return false;

  const stack = [appDir];
  let checked = 0;

  while (stack.length > 0 && checked < 80) {
    const current = stack.pop();
    if (!current) continue;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".js")) continue;

      checked += 1;
      if (referencesMissingChunks(fullPath, serverDir, vendorDir)) return true;
      if (checked >= 80) break;
    }
  }

  return false;
}

export function writeDevLock(root, port) {
  const lockDir = path.join(root, "node_modules", ".cache");
  fs.mkdirSync(lockDir, { recursive: true });
  const lockPath = path.join(lockDir, "dev-server.lock.json");
  fs.writeFileSync(
    lockPath,
    JSON.stringify({ pid: process.pid, port, startedAt: new Date().toISOString() }, null, 2)
  );
  return lockPath;
}

export function removeDevLock(root) {
  const lockPath = path.join(root, "node_modules", ".cache", "dev-server.lock.json");
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });
}

export function readStaleDevLock(root) {
  const lockPath = path.join(root, "node_modules", ".cache", "dev-server.lock.json");
  if (!fs.existsSync(lockPath)) return null;

  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (!lock?.pid) return { lockPath, stale: true };

    try {
      process.kill(lock.pid, 0);
      return { lockPath, stale: false, lock };
    } catch {
      return { lockPath, stale: true, lock };
    }
  } catch {
    return { lockPath, stale: true };
  }
}

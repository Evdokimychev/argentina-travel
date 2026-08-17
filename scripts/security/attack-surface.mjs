#!/usr/bin/env node
/**
 * Static attack-surface inventory for Next.js App Router API handlers.
 * Scans src/app/api route.ts files and writes JSON under var/ops/ (gitignored).
 *
 * Usage: node scripts/security/attack-surface.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const API_ROOT = path.join(ROOT, "src/app/api");
const OUTPUT = path.join(ROOT, "var/ops/attack-surface.json");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === "route.ts" || entry.name === "route.js") files.push(full);
  }
  return files;
}

function routePatternFromFile(filePath) {
  const rel = path.relative(path.join(ROOT, "src/app"), filePath).replace(/\\/g, "/");
  const withoutRoute = rel.replace(/\/route\.(ts|js)$/, "");
  return (
    "/" +
    withoutRoute
      .split("/")
      .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"))
      .map((segment) => segment.replace(/^\[\.\.\.(.+)\]$/, "*").replace(/^\[(.+)\]$/, ":$1"))
      .join("/")
  );
}

function detectMethods(source) {
  return HTTP_METHODS.filter((method) =>
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`).test(
      source,
    ),
  );
}

function detectSignals(source) {
  return {
    authorizeAdminRequest: /authorizeAdminRequest\s*\(/.test(source),
    authorizeStaffManagementRequest: /authorizeStaffManagementRequest\s*\(/.test(source),
    withRateLimit: /withRateLimit\s*\(/.test(source),
    checkSecurityRateLimit: /checkSecurityRateLimit\s*\(/.test(source),
    securityCriticalPolicy: /policy\s*:\s*["']security_critical["']/.test(source),
    cronSecret: /CRON_SECRET|x-cron-secret|authorizeCron/i.test(source),
    csrfNotes: /SameSite|csrf|origin\s*check|sec-fetch-site/i.test(source)
      ? "explicit_csrf_or_origin_markers"
      : "cookie_session_same_site_assumed_for_browser_mutations",
    writeCriticalAdminAuditLog: /writeCriticalAdminAuditLog\s*\(/.test(source),
    writeAdminAuditLog: /writeAdminAuditLog\s*\(/.test(source),
  };
}

export function buildAttackSurfaceInventory(root = ROOT) {
  const apiRoot = path.join(root, "src/app/api");
  const files = walk(apiRoot).sort();
  const routes = files.map((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(root, filePath).replace(/\\/g, "/");
    return {
      route: routePatternFromFile(filePath),
      sourceFile: relativePath,
      methods: detectMethods(source),
      signals: detectSignals(source),
    };
  });

  return {
    schemaVersion: 1,
    kind: "api-attack-surface",
    generatedAt: new Date().toISOString(),
    evidenceLevel: "static_source",
    routeCount: routes.length,
    routes,
  };
}

function main() {
  const inventory = buildAttackSurfaceInventory(ROOT);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true, mode: 0o700 });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(inventory, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(
    JSON.stringify({
      status: "ok",
      routeCount: inventory.routeCount,
      output: path.relative(ROOT, OUTPUT),
    }),
  );
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Register tsx if available for importing TS lifecycle — fallback to JSON draft.
const root = process.cwd();
const outDir = path.join(root, "docs/project-governance");
fs.mkdirSync(outDir, { recursive: true });

const before = JSON.parse(
  fs.readFileSync(path.join(outDir, "sprint7/BEFORE_METRICS.json"), "utf8"),
);

const lifecyclePath = path.join(root, "src/lib/modules/business-lifecycle.ts");
const lifecycleSrc = fs.readFileSync(lifecyclePath, "utf8");
const statuses = [...lifecycleSrc.matchAll(/businessStatus:\s*"([A-Z_]+)"/g)].map((m) => m[1]);
const byStatus = statuses.reduce((acc, s) => {
  acc[s] = (acc[s] ?? 0) + 1;
  return acc;
}, {});

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mainShaHint: before.mainSha,
  moduleLifecycleCounts: byStatus,
  source: "src/lib/modules/business-lifecycle.ts",
  productContract: {
    coreNow: [
      "portal",
      "destinations",
      "places",
      "guide",
      "knowledge-base",
      "blog",
      "tours",
      "excursions",
      "map",
      "booking",
      "affiliate-handoff",
      "organizer-cabinet",
      "admin-operations",
      "contacts-leads",
      "analytics-plumbing",
    ],
    frozenPostLaunch: ["shop", "forum", "hotels", "own_payment", "apartments-native"],
    dormantLaunchClamped: ["car-rental", "transfers", "shop", "forum"],
    experimental: ["podbor", "ai-tour-match", "recommendations", "group-trips"],
  },
};

fs.writeFileSync(path.join(outDir, "module-lifecycle-registry.json"), JSON.stringify(payload, null, 2) + "\n");
console.log("modules:lifecycle wrote module-lifecycle-registry.json");

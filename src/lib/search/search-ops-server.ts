import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { SearchReadinessReport } from "@/lib/search/search-readiness";
import { readSearchReindexStatus } from "@/lib/search/search-reindex-status";
import type { SearchOpsSnapshot } from "@/lib/search/search-ops-types";
import { isMeilisearchConfigured } from "@/lib/search/meilisearch-client";

export type { SearchOpsSnapshot } from "@/lib/search/search-ops-types";

const READINESS_FILE = path.join(process.cwd(), "var/ops/search-readiness-last.json");

function readSearchReadinessReport(): SearchReadinessReport | null {
  if (!fs.existsSync(READINESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(READINESS_FILE, "utf8")) as SearchReadinessReport;
  } catch {
    return null;
  }
}

export function fetchSearchOpsSnapshot(): SearchOpsSnapshot {
  return {
    meilisearchConfigured: isMeilisearchConfigured(),
    readiness: readSearchReadinessReport(),
    lastReindex: readSearchReindexStatus(),
  };
}

import fs from "node:fs";
import path from "node:path";
import type { ReindexResult } from "@/lib/search/types";

export type SearchReindexStatus = {
  ok: boolean;
  ranAt: string;
  source: "admin" | "cron";
  indexed: number;
  removed: number;
  meilisearch?: ReindexResult["meilisearch"];
  error?: string;
};

const STATUS_FILE = path.join(process.cwd(), "var/ops/search-reindex-last.json");

export function writeSearchReindexStatus(
  result: ReindexResult,
  source: SearchReindexStatus["source"]
): SearchReindexStatus {
  const payload: SearchReindexStatus = {
    ok: result.ok,
    ranAt: new Date().toISOString(),
    source,
    indexed: result.indexed,
    removed: result.removed,
    meilisearch: result.meilisearch,
    error: result.error,
  };

  try {
    fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
    fs.writeFileSync(STATUS_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch {
    // Serverless filesystem may be read-only.
  }

  return payload;
}

export function readSearchReindexStatus(): SearchReindexStatus | null {
  if (!fs.existsSync(STATUS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8")) as SearchReindexStatus;
  } catch {
    return null;
  }
}

export function getSearchReindexStatusPath(): string {
  return STATUS_FILE;
}

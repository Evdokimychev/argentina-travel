import fs from "node:fs";
import path from "node:path";
import type { ImageQuery, ResolvedImage } from "./types";
import { CACHE_VERSION } from "./types";

export interface StockCacheEntry {
  key: string;
  resolvedAt: string;
  query: string;
  role: string;
  resolved: ResolvedImage;
}

export interface StockCacheFile {
  version: number;
  updatedAt: string;
  entries: Record<string, StockCacheEntry>;
}

const CACHE_PATHS = [
  path.join(process.cwd(), "src/data/media-library/stock-cache.json"),
  path.join(process.cwd(), "var/cache/image-provider/stock-cache.json"),
];

function primaryCachePath(): string {
  return CACHE_PATHS[0];
}

function cacheKey(query: ImageQuery): string {
  return `${query.role}:${query.query}`;
}

function emptyCache(): StockCacheFile {
  return { version: CACHE_VERSION, updatedAt: new Date().toISOString(), entries: {} };
}

export function readStockCache(): StockCacheFile {
  for (const cachePath of CACHE_PATHS) {
    if (!fs.existsSync(cachePath)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf8")) as StockCacheFile;
      if (data.version !== CACHE_VERSION) return emptyCache();
      return data;
    } catch {
      continue;
    }
  }
  return emptyCache();
}

export function writeStockCache(cache: StockCacheFile): void {
  const payload: StockCacheFile = {
    ...cache,
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  for (const cachePath of CACHE_PATHS) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, json, "utf8");
  }
}

export function getCachedImage(query: ImageQuery): ResolvedImage | null {
  const cache = readStockCache();
  const entry = cache.entries[cacheKey(query)];
  if (!entry) return null;
  const ageMs = Date.now() - new Date(entry.resolvedAt).getTime();
  const ttlMs = 30 * 24 * 60 * 60 * 1000;
  if (ageMs > ttlMs) return null;
  return entry.resolved;
}

export function setCachedImage(query: ImageQuery, resolved: ResolvedImage): void {
  const cache = readStockCache();
  const key = cacheKey(query);
  cache.entries[key] = {
    key,
    resolvedAt: new Date().toISOString(),
    query: query.query,
    role: query.role,
    resolved,
  };
  writeStockCache(cache);
}

export function getCachePath(): string {
  return primaryCachePath();
}

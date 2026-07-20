import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentPath = path.join(root, "content/knowledge-base/_index/content.json");
const outputPath = path.join(root, "var/ops/kb-link-check.json");
const includeArchived = process.argv.includes("--all");
const strict = process.argv.includes("--strict");
const concurrency = Math.max(1, Math.min(16, Number(process.env.KB_LINK_CONCURRENCY) || 8));
const timeoutMs = Math.max(3_000, Number(process.env.KB_LINK_TIMEOUT_MS) || 12_000);
const USER_AGENT = "GoArgentina-KnowledgeBase-LinkCheck/1.0 (+https://www.goargentina.ru)";

function bodyUrls(value = "") {
  return [...String(value).matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g)].map(
    (match) => match[1],
  );
}

function addUrl(registry, rawUrl, context) {
  const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!value) return;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    registry.set(`invalid:${value}`, {
      url: value,
      invalid: true,
      contexts: [...(registry.get(`invalid:${value}`)?.contexts ?? []), context],
    });
    return;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return;
  parsed.hash = "";
  const url = parsed.toString();
  const current = registry.get(url) ?? { url, invalid: false, contexts: [] };
  current.contexts.push(context);
  registry.set(url, current);
}

function classify(status) {
  if (status >= 200 && status < 400) return "ok";
  if ([401, 403, 405, 429].includes(status)) return "protected_or_rate_limited";
  if ([404, 410, 451].includes(status)) return "broken";
  if (status >= 500) return "server_error";
  return "unexpected_status";
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        ...(method === "GET" ? { range: "bytes=0-1023" } : {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function check(item) {
  if (item.invalid) {
    return { ...item, status: null, result: "invalid_url", finalUrl: null, error: null };
  }
  const startedAt = Date.now();
  try {
    let response = await fetchWithTimeout(item.url, "HEAD");
    if ([400, 403, 405, 429, 501].includes(response.status)) {
      response = await fetchWithTimeout(item.url, "GET");
    }
    return {
      ...item,
      status: response.status,
      result: classify(response.status),
      finalUrl: response.url,
      redirected: response.url !== item.url,
      elapsedMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      ...item,
      status: null,
      result: error?.name === "AbortError" ? "timeout" : "network_error",
      finalUrl: null,
      redirected: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const raw = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const registry = new Map();
for (const entry of raw.entities ?? []) {
  if (!includeArchived && entry.status !== "published") continue;
  const publicContext = entry.status === "published";
  for (const [index, source] of (entry.sources ?? []).entries()) {
    addUrl(registry, source?.url, {
      id: entry.id,
      kind: "source",
      index,
      public: publicContext,
    });
  }
  const images = [entry.media?.hero, ...(entry.media?.gallery ?? [])].filter(Boolean);
  for (const [index, image] of images.entries()) {
    addUrl(registry, image?.source_page, {
      id: entry.id,
      kind: "media_source",
      index,
      public: publicContext,
    });
    if (/^https?:\/\//i.test(image?.url ?? "")) {
      addUrl(registry, image.url, {
        id: entry.id,
        kind: "media_asset",
        index,
        public: publicContext,
      });
    }
  }
  for (const [index, url] of bodyUrls(entry.body).entries()) {
    addUrl(registry, url, {
      id: entry.id,
      kind: "markdown_link",
      index,
      public: publicContext,
    });
  }
}

const queue = [...registry.values()];
const results = new Array(queue.length);
let cursor = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, Math.max(queue.length, 1)) }, async () => {
    while (cursor < queue.length) {
      const index = cursor++;
      results[index] = await check(queue[index]);
    }
  }),
);

const counts = results.reduce((acc, result) => {
  acc[result.result] = (acc[result.result] ?? 0) + 1;
  return acc;
}, {});
const brokenPublic = results.filter(
  (result) =>
    ["broken", "invalid_url"].includes(result.result) &&
    result.contexts.some((context) => context.public),
);
const report = {
  generatedAt: new Date().toISOString(),
  scope: includeArchived ? "all-knowledge-base-records" : "published-records",
  uniqueUrls: results.length,
  counts,
  brokenPublic: brokenPublic.length,
  results,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...counts, uniqueUrls: results.length, brokenPublic: brokenPublic.length }, null, 2));
if (strict && brokenPublic.length > 0) process.exitCode = 1;

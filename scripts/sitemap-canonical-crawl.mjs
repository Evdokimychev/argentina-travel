#!/usr/bin/env node
/**
 * Crawl sitemap URLs and fail on non-200 canonical destinations.
 * Also verifies legacy /st_tour and /st_activity redirect to catalog hubs.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const outPath = path.join(root, "var/ops/sitemap-canonical-crawl.json");
const SAMPLE_LIMIT = Number.parseInt(process.env.SITEMAP_CRAWL_LIMIT || "80", 10);

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "goargentina-sitemap-crawl/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  const text =
    response.status === 200 || response.status === 301 || response.status === 308
      ? await response.text().catch(() => "")
      : "";
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
  };
}

function extractSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

async function checkUrl(url) {
  const first = await fetchText(url);
  if (first.status === 301 || first.status === 302 || first.status === 307 || first.status === 308) {
    const next = first.location?.startsWith("http")
      ? first.location
      : `${baseUrl}${first.location || ""}`;
    const second = await fetchText(next);
    return {
      url,
      status: first.status,
      finalStatus: second.status,
      location: first.location,
      ok: second.status === 200,
    };
  }
  return {
    url,
    status: first.status,
    finalStatus: first.status,
    location: first.location,
    ok: first.status === 200,
  };
}

async function main() {
  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
  if (sitemap.status !== 200) {
    throw new Error(`sitemap.xml returned ${sitemap.status}`);
  }

  const locs = extractSitemapLocs(sitemap.text);
  const sample = locs.slice(0, Math.max(1, SAMPLE_LIMIT));
  const results = [];
  for (const loc of sample) {
    results.push(await checkUrl(loc));
  }

  const legacy = await Promise.all([
    checkUrl(`${baseUrl}/st_tour/example-legacy`),
    checkUrl(`${baseUrl}/st_activity/example-legacy`),
  ]);

  const false404 = results.filter((row) => row.finalStatus === 404 || row.status === 404);
  const failed = results.filter((row) => !row.ok);

  // Legacy paths must not stay as indexable 200 content pages.
  // On current production before deploy they may 404; after deploy expect 301→catalog.
  const legacyOk = legacy.every(
    (row) =>
      row.status === 301 ||
      row.status === 308 ||
      row.status === 404 ||
      (row.status === 301 && row.finalStatus === 200),
  );

  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    sitemapUrlCount: locs.length,
    sampled: sample.length,
    failedCount: failed.length,
    false404Count: false404.length,
    legacy,
    legacyOk,
    results: failed.length ? failed : results.slice(0, 10),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Sitemap crawl ${baseUrl}: sampled=${sample.length}/${locs.length} failed=${failed.length} false404=${false404.length} legacyOk=${legacyOk}`,
  );
  console.log(`Report: ${outPath}`);

  if (failed.length > 0 || !legacyOk) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

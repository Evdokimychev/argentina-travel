#!/usr/bin/env node
/**
 * Crawl public tour card hrefs and verify detail pages are not false-404.
 * Usage:
 *   node scripts/public-card-detail-crawl.mjs
 *   SMOKE_BASE_URL=https://www.goargentina.ru node scripts/public-card-detail-crawl.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const outPath = path.join(root, "var/ops/public-card-detail-crawl.json");

const KNOWN_REGRESSION_SLUGS = [
  "po-kontrastnoy-argentine-v-ritme-tango-buenos-ayres-patagoniya-vodopady-iguasu-i-t108535",
  "chudesa-brazilii-rio-i-dzhungli-amazonii-dzhiping-v-natsparke-halapao-i-vodopady-t70643",
  "vlyubitsya-v-prirodu-yuzhnoy-ameriki-bolshoe-aktivnoe-puteshestvie-v-patagoniyu--t92278",
  "bolshoy-tur-v-argentinu-chili-i-braziliyu-trekkingi-v-patagonii-vodopady-iguasu--t92532",
];

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "goargentina-public-card-crawl/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  const text = response.status === 200 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location"), text };
}

function extractTourHrefs(html) {
  const matches = [...html.matchAll(/href="(\/tours\/[a-z0-9-]+)"/gi)].map((m) => m[1]);
  return [...new Set(matches)];
}

async function checkDetail(pathname) {
  const url = `${baseUrl}${pathname}`;
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "goargentina-public-card-crawl/1.0" },
    signal: AbortSignal.timeout(25_000),
  });
  const text = response.status === 200 || response.status === 503 ? await response.text() : "";
  const unavailable = /временно недоступ/i.test(text);
  const h1Count = (text.match(/<h1\b/gi) || []).length;
  return {
    pathname,
    status: response.status,
    location: response.headers.get("location"),
    unavailable,
    h1Count,
    ok:
      response.status === 200 ||
      response.status === 301 ||
      response.status === 302 ||
      response.status === 308 ||
      response.status === 503,
    false404: response.status === 404,
  };
}

async function main() {
  const pages = ["/", "/tours"];
  const cardHrefs = new Set(KNOWN_REGRESSION_SLUGS.map((slug) => `/tours/${slug}`));

  for (const page of pages) {
    const result = await fetchText(`${baseUrl}${page}`);
    if (result.status !== 200) {
      console.error(`Failed to load ${page}: ${result.status}`);
      process.exitCode = 1;
      continue;
    }
    for (const href of extractTourHrefs(result.text)) {
      cardHrefs.add(href);
    }
  }

  const results = [];
  for (const href of [...cardHrefs].sort()) {
    results.push(await checkDetail(href));
  }

  const false404 = results.filter((row) => row.false404);
  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    cardCount: results.length,
    false404Count: false404.length,
    unavailableCount: results.filter((row) => row.status === 503 || row.unavailable).length,
    okCount: results.filter((row) => row.ok && !row.false404).length,
    results,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `Crawled ${report.cardCount} tour URLs on ${baseUrl}: ok=${report.okCount} false404=${report.false404Count} unavailable=${report.unavailableCount}`,
  );
  console.log(`Report: ${outPath}`);

  if (false404.length > 0) {
    console.error("False/public 404s:");
    for (const row of false404) console.error(`  ${row.status} ${row.pathname}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

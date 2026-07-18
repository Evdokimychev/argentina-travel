#!/usr/bin/env node
/**
 * SEO audit: full sitemap crawl, metadata, indexability, hreflang and JSON-LD.
 *
 * Requires a running Next.js server (dev or production).
 *
 * Env:
 * - SEO_AUDIT_BASE_URL — default http://127.0.0.1:3000
 * - SEO_AUDIT_TIMEOUT_MS — default 15000
 * - SEO_AUDIT_CONCURRENCY — default 8
 * - SEO_AUDIT_MAX_URLS — optional diagnostic limit (default: all sitemap URLs)
 * - SEO_AUDIT_CANONICAL_ORIGIN — default https://www.goargentina.ru
 * - SEO_AUDIT_REPORT_PATH — default var/ops/seo-audit-last.json
 * - SEO_AUDIT_ENFORCE_RESPONSE_NOINDEX — set 1 to enforce preview X-Robots-Tag headers
 *
 * Usage:
 *   node scripts/seo-audit.mjs
 *   npm run seo-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "./lib/candidate-evidence.mjs";
import { hasCompatibleSchemaType } from "./lib/seo-schema-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const auditFile = process.env.SEO_AUDIT_REPORT_PATH
  ? path.resolve(root, process.env.SEO_AUDIT_REPORT_PATH)
  : path.join(opsDir, "seo-audit-last.json");

const baseUrl = (process.env.SEO_AUDIT_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const canonicalOrigin = (process.env.SEO_AUDIT_CANONICAL_ORIGIN ?? "https://www.goargentina.ru").replace(/\/$/, "");
const enforceResponseNoindex = process.env.SEO_AUDIT_ENFORCE_RESPONSE_NOINDEX === "1"
  || new URL(baseUrl).origin === new URL(canonicalOrigin).origin;
const timeoutMs = Number.parseInt(process.env.SEO_AUDIT_TIMEOUT_MS ?? process.env.SMOKE_TIMEOUT_MS ?? "15000", 10);
const concurrency = Math.max(1, Number.parseInt(process.env.SEO_AUDIT_CONCURRENCY ?? "8", 10) || 8);
const maxUrls = Math.max(0, Number.parseInt(process.env.SEO_AUDIT_MAX_URLS ?? "0", 10) || 0);

const METADATA_SAMPLES = ["/", "/tours", "/excursions"];
const JSON_LD_SAMPLES = [
  { path: null, types: ["Product"], label: "tour detail", dynamic: "tour" },
  { path: null, types: ["TouristTrip"], label: "excursion detail", dynamic: "excursion" },
  { path: "/blog/best-time-to-visit-argentina", types: ["Article"], label: "blog post" },
];

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function truncate(text, max = 200) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function fetchText(urlOrPath) {
  const url = urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")
    ? urlOrPath
    : `${baseUrl}${urlOrPath}`;
  const response = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
    headers: { Accept: "text/html,application/xhtml+xml,application/xml" },
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
    url,
    finalUrl: response.url,
    redirected: response.redirected,
    contentType: response.headers.get("content-type") ?? "",
    xRobotsTag: response.headers.get("x-robots-tag") ?? "",
  };
}

function parseSitemapXml(xml) {
  const locs = [];
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    locs.push(match[1].trim());
  }
  return locs;
}

function extractMetaContent(html, name) {
  const re = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const altRe = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i");
  return re.exec(html)?.[1] ?? altRe.exec(html)?.[1] ?? null;
}

function extractPropertyContent(html, property) {
  const re = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i");
  const altRe = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i");
  return re.exec(html)?.[1] ?? altRe.exec(html)?.[1] ?? null;
}

function extractRobotsContent(html) {
  return ["robots", "googlebot", "yandex"]
    .map((name) => extractMetaContent(html, name))
    .filter(Boolean)
    .join(",")
    .toLowerCase();
}

function extractH1Count(html) {
  return [...html.matchAll(/<h1(?:\s[^>]*)?>/gi)].length;
}

function extractTitle(html) {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
}

function extractCanonical(html) {
  const re = /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i;
  const altRe = /<link\s+[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i;
  return re.exec(html)?.[1] ?? altRe.exec(html)?.[1] ?? null;
}

function extractHreflangLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<link\s+[^>]*rel=["']alternate["'][^>]*>/gi)) {
    const tag = match[0];
    const hreflang = /hreflang=["']([^"']+)["']/i.exec(tag)?.[1];
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (hreflang && href) links.push({ hreflang, href });
  }
  return links;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = match[1].trim();
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      blocks.push({ _parseError: true, raw: truncate(raw, 120) });
    }
  }
  return blocks;
}

function collectSchemaTypes(node, types = new Set()) {
  if (!node || typeof node !== "object") return types;

  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, types);
    return types;
  }

  const type = node["@type"];
  if (typeof type === "string") types.add(type);
  if (Array.isArray(type)) type.forEach((t) => types.add(t));

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectSchemaTypes(value, types);
  }

  return types;
}

function pathFromSitemapUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

function normalizeUrl(urlOrPath, origin = canonicalOrigin) {
  try {
    const url = new URL(urlOrPath, origin);
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function isNoIndex(robotsContent, xRobotsTag = "") {
  return `${robotsContent},${xRobotsTag}`
    .toLowerCase()
    .split(/[;,]/)
    .some((value) => value.trim() === "noindex");
}

function checkSitemapStructure(sitemapUrls) {
  const issues = [];
  const seen = new Set();
  const expectedOrigin = new URL(canonicalOrigin).origin;

  for (const value of sitemapUrls) {
    let url;
    try {
      url = new URL(value);
    } catch {
      issues.push(`Sitemap contains an invalid URL: ${value}`);
      continue;
    }

    const normalized = normalizeUrl(url.toString());
    if (seen.has(normalized)) issues.push(`Sitemap contains a duplicate URL: ${value}`);
    seen.add(normalized);
    if (url.origin !== expectedOrigin) issues.push(`Sitemap URL uses another origin: ${value}`);
    if (url.search || url.hash) issues.push(`Sitemap URL contains query/hash: ${value}`);
  }

  return issues;
}

function localAuditTarget(urlOrPath) {
  try {
    const url = new URL(urlOrPath, canonicalOrigin);
    if (url.origin === new URL(canonicalOrigin).origin) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Let fetch surface the invalid URL in the audit result.
  }
  return urlOrPath;
}

async function mapWithConcurrency(items, worker, limit = concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function addGroupedValue(map, value, pagePath) {
  if (!value) return;
  const key = value.trim().replace(/\s+/g, " ");
  const paths = map.get(key) ?? [];
  paths.push(pagePath);
  map.set(key, paths);
}

async function resolveExcursionSamplePath() {
  const { text, status } = await fetchText("/excursions");
  if (status === 200) {
    const slugMatch = text.match(/href=["']\/excursions\/([^"'/?#]+)["']/i);
    if (slugMatch) return `/excursions/${slugMatch[1]}`;
  }
  return resolveSamplePathFromSitemap("excursions");
}

async function resolveTourSamplePath() {
  const { text, status } = await fetchText("/tours");
  if (status === 200) {
    const detailMatch = text.match(/href=["'](\/tours\/[^"'/?#]+)["']/i);
    if (detailMatch) return detailMatch[1];
  }
  const { text: sitemapText, status: sitemapStatus } = await fetchText("/sitemap.xml");
  if (sitemapStatus !== 200) return null;
  return parseSitemapXml(sitemapText)
    .map(pathFromSitemapUrl)
    .find((pagePath) => /^\/tours\/[^/]+$/.test(pagePath)) ?? null;
}

async function resolveSamplePathFromSitemap(kind) {
  const { text, status } = await fetchText("/sitemap.xml");
  if (status !== 200) return null;
  const prefix = `/${kind}/`;
  return parseSitemapXml(text)
    .map(pathFromSitemapUrl)
    .find((pagePath) => pagePath.startsWith(prefix) && pagePath.slice(prefix.length).length > 0) ?? null;
}

async function auditPageMetadata(pagePath, requireHreflang = false) {
  const issues = [];
  const { status, text } = await fetchText(pagePath);

  if (status !== 200) {
    issues.push(`${pagePath}: HTTP ${status}`);
    return { path: pagePath, status, issues, ok: false };
  }

  const title = extractTitle(text);
  const description = extractMetaContent(text, "description");
  const canonical = extractCanonical(text);
  const hreflang = extractHreflangLinks(text);

  if (!title) issues.push(`${pagePath}: missing <title>`);
  if (!description) issues.push(`${pagePath}: missing meta description`);
  if (!canonical) issues.push(`${pagePath}: missing canonical link`);

  if (requireHreflang) {
    const langs = new Set(hreflang.map((l) => l.hreflang));
    for (const lang of ["ru", "es", "en", "x-default"]) {
      if (!langs.has(lang)) issues.push(`${pagePath}: missing hreflang="${lang}"`);
    }
  }

  return { path: pagePath, status, title, description, canonical, hreflang, issues, ok: issues.length === 0 };
}

async function auditSitemapPage(pageUrl) {
  const pagePath = pathFromSitemapUrl(pageUrl);
  const criticalIssues = [];
  const warnings = [];

  let response;
  try {
    response = await fetchText(localAuditTarget(pageUrl));
  } catch (error) {
    criticalIssues.push(`${pagePath}: request failed (${error instanceof Error ? error.message : String(error)})`);
    return { path: pagePath, url: pageUrl, status: 0, criticalIssues, warnings, ok: false };
  }

  const { status, text, redirected, finalUrl, contentType, xRobotsTag } = response;
  const title = extractTitle(text);
  const description = extractMetaContent(text, "description");
  const canonical = extractCanonical(text);
  const canonicalUrl = canonical ? normalizeUrl(canonical) : null;
  const expectedCanonical = normalizeUrl(pageUrl);
  const expectedFetchUrl = normalizeUrl(pagePath, baseUrl);
  const robots = extractRobotsContent(text);
  const hreflang = extractHreflangLinks(text);
  const h1Count = extractH1Count(text);
  const ogTitle = extractPropertyContent(text, "og:title");
  const ogImage = extractPropertyContent(text, "og:image");
  const ogUrl = extractPropertyContent(text, "og:url");
  const jsonLdBlocks = extractJsonLdBlocks(text);
  const invalidJsonLd = jsonLdBlocks.filter((block) => block?._parseError);

  if (status !== 200) criticalIssues.push(`${pagePath}: HTTP ${status}`);
  if (redirected || normalizeUrl(finalUrl, baseUrl) !== expectedFetchUrl) {
    criticalIssues.push(`${pagePath}: sitemap URL redirects to ${finalUrl}`);
  }
  if (!contentType.toLowerCase().includes("text/html")) {
    criticalIssues.push(`${pagePath}: expected text/html, received ${contentType || "unknown content type"}`);
  }
  if (!title) criticalIssues.push(`${pagePath}: missing <title>`);
  if (!description) criticalIssues.push(`${pagePath}: missing meta description`);
  if (!canonical) {
    criticalIssues.push(`${pagePath}: missing canonical link`);
  } else if (!canonicalUrl) {
    criticalIssues.push(`${pagePath}: invalid canonical URL (${canonical})`);
  } else if (canonicalUrl !== expectedCanonical) {
    criticalIssues.push(`${pagePath}: canonical is not self-referencing (${canonical})`);
  }
  if (isNoIndex(robots, enforceResponseNoindex ? xRobotsTag : "")) {
    criticalIssues.push(`${pagePath}: sitemap URL is noindex`);
  }
  if (invalidJsonLd.length > 0) criticalIssues.push(`${pagePath}: invalid JSON-LD block`);

  if (title && (title.length < 15 || title.length > 70)) {
    warnings.push(`${pagePath}: title length is ${title.length} characters`);
  }
  if (description && (description.length < 50 || description.length > 180)) {
    warnings.push(`${pagePath}: description length is ${description.length} characters`);
  }
  if (h1Count !== 1) warnings.push(`${pagePath}: expected one H1, found ${h1Count}`);
  if (!ogTitle) warnings.push(`${pagePath}: missing og:title`);
  if (!ogImage) warnings.push(`${pagePath}: missing og:image`);
  if (ogUrl && normalizeUrl(ogUrl) !== expectedCanonical) {
    warnings.push(`${pagePath}: og:url differs from canonical (${ogUrl})`);
  }

  return {
    path: pagePath,
    url: pageUrl,
    status,
    title,
    description,
    canonical,
    robots,
    hreflang,
    h1Count,
    jsonLdBlocks: jsonLdBlocks.length,
    criticalIssues,
    warnings,
    ok: criticalIssues.length === 0,
    _html: text,
    _xRobotsTag: xRobotsTag,
  };
}

async function auditHreflang(pages) {
  const issues = [];
  const cache = new Map(pages.map((page) => [normalizeUrl(page.url), page]));

  async function resolveAlternate(url) {
    const normalized = normalizeUrl(url);
    if (!normalized) return null;
    if (cache.has(normalized)) return cache.get(normalized);

    try {
      const response = await fetchText(localAuditTarget(url));
      const alternate = {
        url,
        status: response.status,
        robots: extractRobotsContent(response.text),
        hreflang: extractHreflangLinks(response.text),
        _xRobotsTag: response.xRobotsTag,
      };
      cache.set(normalized, alternate);
      return alternate;
    } catch {
      return null;
    }
  }

  for (const page of pages) {
    if (!page.hreflang?.length) continue;
    const sourceCanonical = normalizeUrl(page.canonical ?? page.url);
    const alternateUrls = new Set(page.hreflang.map((link) => normalizeUrl(link.href)).filter(Boolean));

    if (!alternateUrls.has(sourceCanonical)) {
      issues.push(`${page.path}: hreflang set has no self-reference`);
    }

    for (const link of page.hreflang) {
      const alternate = await resolveAlternate(link.href);
      if (!alternate) {
        issues.push(`${page.path}: hreflang ${link.hreflang} is unreachable (${link.href})`);
        continue;
      }
      if (alternate.status !== 200) {
        issues.push(`${page.path}: hreflang ${link.hreflang} returns HTTP ${alternate.status}`);
        continue;
      }
      if (isNoIndex(alternate.robots, enforceResponseNoindex ? alternate._xRobotsTag : "")) {
        issues.push(`${page.path}: hreflang ${link.hreflang} points to noindex (${link.href})`);
      }

      const reciprocal = alternate.hreflang.some(
        (backLink) => normalizeUrl(backLink.href) === sourceCanonical,
      );
      if (!reciprocal) {
        issues.push(`${page.path}: hreflang ${link.hreflang} has no reciprocal link (${link.href})`);
      }
    }
  }

  return issues;
}

async function auditJsonLdSample(sample) {
  let pagePath = sample.path;

  if (sample.dynamic === "tour") {
    pagePath = await resolveTourSamplePath();
    if (!pagePath) {
      return {
        label: sample.label,
        path: null,
        ok: true,
        skipped: true,
        issues: ["No public tour detail is present in the catalog or sitemap"],
      };
    }
  }

  if (sample.dynamic === "excursion") {
    pagePath = await resolveExcursionSamplePath();
    if (!pagePath) {
      return {
        label: sample.label,
        path: null,
        ok: true,
        skipped: true,
        issues: ["No public excursion detail is present in the catalog or sitemap"],
      };
    }
  }

  const { status, text } = await fetchText(pagePath);
  const issues = [];

  if (status !== 200) {
    return { label: sample.label, path: pagePath, ok: false, issues: [`HTTP ${status}`] };
  }

  const blocks = extractJsonLdBlocks(text);
  if (blocks.length === 0) {
    issues.push("No application/ld+json blocks found");
  }

  const types = new Set();
  for (const block of blocks) {
    if (block._parseError) {
      issues.push(`Invalid JSON-LD: ${block.raw}`);
      continue;
    }
    collectSchemaTypes(block, types);
  }

  for (const expectedType of sample.types) {
    if (!hasCompatibleSchemaType(types, expectedType)) {
      issues.push(`Missing schema.org @type: ${expectedType} (found: ${[...types].join(", ") || "none"})`);
    }
  }

  return {
    label: sample.label,
    path: pagePath,
    ok: issues.length === 0,
    issues,
    types: [...types],
  };
}

async function auditDestinationsHub() {
  const issues = [];
  const { status, text } = await fetchText("/destinations");

  if (status !== 200) {
    return { path: "/destinations", ok: false, issues: [`HTTP ${status}`] };
  }

  const hasSrOnlyNav =
    /aria-label=["'][^"']*поисковых систем["']/i.test(text) ||
    /class=["'][^"']*sr-only["'][^>]*>[\s\S]*<a href=["']\/destinations\//i.test(text);
  const types = new Set();
  for (const block of extractJsonLdBlocks(text)) {
    if (!block._parseError) collectSchemaTypes(block, types);
  }
  const hasItemList = types.has("ItemList");

  if (!hasSrOnlyNav && !hasItemList) {
    issues.push("/destinations: missing sr-only nav links and ItemList JSON-LD");
  }

  return { path: "/destinations", ok: issues.length === 0, issues, hasSrOnlyNav, hasItemList };
}

async function auditLocaleFallbackIndexing() {
  const issues = [];
  const samples = [];

  for (const pagePath of ["/en/places", "/es/places"]) {
    const { status, text, xRobotsTag } = await fetchText(pagePath);
    const robots = extractRobotsContent(text);
    const noindex = isNoIndex(robots, xRobotsTag);
    samples.push({ path: pagePath, status, noindex });

    if (status !== 200) {
      issues.push(`${pagePath}: HTTP ${status}`);
    } else if (!noindex) {
      issues.push(`${pagePath}: untranslated locale fallback must stay noindex until explicitly published`);
    }
  }

  return { path: "/en|es/places", ok: issues.length === 0, issues, samples };
}

async function main() {
  loadEnvLocal();
  fs.mkdirSync(path.dirname(auditFile), { recursive: true });

  const isCanonicalProduction = new URL(baseUrl).origin === new URL(canonicalOrigin).origin;
  const evidenceScope = isCanonicalProduction
    ? "production-baseline"
    : process.env.SEO_AUDIT_EVIDENCE_SCOPE ??
      (path.basename(auditFile).includes("production-baseline") ? "production-baseline" : "candidate");
  const candidateContext = evidenceScope === "candidate" ? captureCandidateContext(root) : null;

  const report = {
    checkedAt: new Date().toISOString(),
    evidenceScope,
    evidenceEnvironment:
      process.env.EVIDENCE_ENVIRONMENT ??
      (evidenceScope === "candidate" ? "local-production" : "production-baseline"),
    evidenceBaseUrl: baseUrl,
    deploymentId: process.env.EVIDENCE_DEPLOYMENT_ID ?? null,
    deployedTree: process.env.EVIDENCE_DEPLOYED_TREE ?? null,
    baseUrl,
    configuration: {
      canonicalOrigin,
      concurrency,
      enforceResponseNoindex,
      maxUrls: maxUrls || null,
    },
    robotsTxt: { ok: false, issues: [] },
    sitemap: {
      urlCount: 0,
      crawledUrlCount: 0,
      structureIssues: [],
      criticalIssues: [],
      warnings: [],
      hreflangIssues: [],
      duplicateMetadata: [],
      pages: [],
    },
    metadata: [],
    jsonLd: [],
    hubPages: [],
    staticChecks: [],
    ok: true,
  };

  console.log(`SEO audit base URL: ${baseUrl}`);

  // Static source checks (no server required)
  const staticFiles = [
    ["src/components/seo/TourJsonLd.tsx", "Tour Product JSON-LD component"],
    ["src/lib/tour-json-ld.ts", "Tour Product JSON-LD builder"],
    ["src/lib/excursion-json-ld.ts", "Excursion JSON-LD builder"],
    ["src/components/seo/BreadcrumbListJsonLd.tsx", "BreadcrumbList JSON-LD component"],
    ["src/lib/i18n/sitemap-locales.ts", "i18n sitemap expansion"],
  ];

  for (const [relPath, label] of staticFiles) {
    const exists = fs.existsSync(path.join(root, relPath));
    report.staticChecks.push({ file: relPath, label, ok: exists });
    if (!exists) {
      report.ok = false;
      console.error(`✗ static: missing ${relPath}`);
    } else {
      console.log(`✓ static: ${label}`);
    }
  }

  // Live HTTP checks
  let sitemapUrls = [];
  try {
    const robots = await fetchText("/robots.txt");
    const expectedSitemap = normalizeUrl("/sitemap.xml");
    if (robots.status !== 200) report.robotsTxt.issues.push(`GET /robots.txt returned ${robots.status}`);
    if (!robots.contentType.toLowerCase().includes("text/plain")) {
      report.robotsTxt.issues.push(`robots.txt content type is ${robots.contentType || "missing"}`);
    }
    const sitemapDirectives = [...robots.text.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)].map((match) => normalizeUrl(match[1]));
    const auditingCanonicalOrigin = new URL(baseUrl).origin === canonicalOrigin;
    if (auditingCanonicalOrigin && !sitemapDirectives.includes(expectedSitemap)) {
      report.robotsTxt.issues.push(`robots.txt does not reference ${expectedSitemap}`);
    }
    if (!auditingCanonicalOrigin && !/^\s*Disallow:\s*\/\s*$/im.test(robots.text)) {
      report.robotsTxt.issues.push("non-canonical preview robots.txt must disallow all crawling");
    }
    report.robotsTxt.ok = report.robotsTxt.issues.length === 0;
    if (!report.robotsTxt.ok) {
      report.ok = false;
      for (const issue of report.robotsTxt.issues) console.error(`✗ ${issue}`);
    } else {
      console.log(
        auditingCanonicalOrigin
          ? "✓ robots.txt — valid sitemap directive"
          : "✓ robots.txt — preview indexing is blocked",
      );
    }

    const sitemap = await fetchText("/sitemap.xml");
    assert(sitemap.status === 200, `GET /sitemap.xml returned ${sitemap.status}`);
    sitemapUrls = parseSitemapXml(sitemap.text);
    assert(sitemapUrls.length > 0, "sitemap.xml contains no <loc> URLs");
    report.sitemap.urlCount = sitemapUrls.length;
    console.log(`✓ sitemap.xml — ${sitemapUrls.length} URLs`);

    const structureIssues = checkSitemapStructure(sitemapUrls);
    report.sitemap.structureIssues = structureIssues;
    for (const issue of structureIssues) {
      report.ok = false;
      console.error(`✗ ${issue}`);
    }
    if (structureIssues.length === 0) {
      console.log("✓ sitemap URLs — unique, canonical origin, no query/hash");
    }

    const urlsToCrawl = maxUrls > 0 ? sitemapUrls.slice(0, maxUrls) : sitemapUrls;
    console.log(`… crawling ${urlsToCrawl.length} sitemap URLs (concurrency ${concurrency})`);
    const pages = await mapWithConcurrency(urlsToCrawl, auditSitemapPage);
    report.sitemap.crawledUrlCount = pages.length;

    const titleMap = new Map();
    const descriptionMap = new Map();
    for (const page of pages) {
      addGroupedValue(titleMap, page.title, page.path);
      addGroupedValue(descriptionMap, page.description, page.path);
      report.sitemap.criticalIssues.push(...page.criticalIssues);
      report.sitemap.warnings.push(...page.warnings);
    }

    for (const [kind, values] of [["title", titleMap], ["description", descriptionMap]]) {
      for (const [value, paths] of values) {
        if (paths.length < 2) continue;
        const duplicate = {
          kind,
          value: truncate(value, 160),
          count: paths.length,
          paths: paths.slice(0, 20),
        };
        report.sitemap.duplicateMetadata.push(duplicate);
        report.sitemap.warnings.push(
          `Duplicate ${kind} on ${paths.length} pages: ${paths.slice(0, 5).join(", ")}`,
        );
      }
    }

    const hreflangIssues = await auditHreflang(pages);
    report.sitemap.hreflangIssues = hreflangIssues;
    report.sitemap.criticalIssues.push(...hreflangIssues);
    report.sitemap.pages = pages.map(({ _html, _xRobotsTag, ...page }) => page);

    if (report.sitemap.criticalIssues.length > 0) {
      report.ok = false;
      console.error(`✗ full sitemap crawl — ${report.sitemap.criticalIssues.length} critical issue(s)`);
      for (const issue of report.sitemap.criticalIssues.slice(0, 30)) console.error(`  - ${issue}`);
      if (report.sitemap.criticalIssues.length > 30) {
        console.error(`  … ${report.sitemap.criticalIssues.length - 30} more in the JSON report`);
      }
    } else {
      console.log(`✓ full sitemap crawl — ${pages.length}/${sitemapUrls.length} pages indexable with self-canonical`);
    }
    if (report.sitemap.warnings.length > 0) {
      console.warn(`! content/metadata warnings: ${report.sitemap.warnings.length} (see JSON report)`);
    }
  } catch (error) {
    report.ok = false;
    report.sitemap.error = error instanceof Error ? error.message : String(error);
    console.error(`✗ sitemap: ${report.sitemap.error}`);
    console.error("  Start dev server: npm run dev");
  }

  for (const pagePath of METADATA_SAMPLES) {
    const result = await auditPageMetadata(pagePath);
    report.metadata.push(result);
    if (result.ok) {
      console.log(`✓ metadata: ${pagePath}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${issue}`);
    }
  }

  for (const sample of JSON_LD_SAMPLES) {
    const result = await auditJsonLdSample(sample);
    report.jsonLd.push(result);
    if (result.skipped) {
      console.log(`– JSON-LD (${sample.label}): skipped — ${result.issues[0]}`);
    } else if (result.ok) {
      console.log(`✓ JSON-LD (${sample.label}): ${result.path}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${sample.label}: ${issue}`);
    }
  }

  for (const audit of [auditDestinationsHub, auditLocaleFallbackIndexing]) {
    const result = await audit();
    report.hubPages.push(result);
    if (result.ok) {
      console.log(`✓ hub page SEO: ${result.path}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${issue}`);
    }
  }

  if (candidateContext) {
    const evidence = finalizeCandidateEvidence(root, candidateContext, {
      environment: report.evidenceEnvironment,
      baseUrl,
    });
    Object.assign(report, evidence);
    if (evidence.evidenceIntegrity.status !== "passed") report.ok = false;
  }

  fs.writeFileSync(auditFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nReport: ${path.relative(root, auditFile)}`);

  if (!report.ok) {
    process.exitCode = 1;
    console.error("\nSEO audit failed.");
  } else {
    console.log("\nSEO audit passed.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

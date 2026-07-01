#!/usr/bin/env node
/**
 * SEO audit: sitemap URLs, metadata, JSON-LD on sample pages.
 *
 * Requires a running Next.js server (dev or production).
 *
 * Env:
 * - SEO_AUDIT_BASE_URL — default http://127.0.0.1:3000
 * - SEO_AUDIT_TIMEOUT_MS — default 15000
 *
 * Usage:
 *   node scripts/seo-audit.mjs
 *   npm run seo-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const auditFile = path.join(opsDir, "seo-audit-last.json");

const baseUrl = (process.env.SEO_AUDIT_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const timeoutMs = Number.parseInt(process.env.SEO_AUDIT_TIMEOUT_MS ?? process.env.SMOKE_TIMEOUT_MS ?? "15000", 10);

const HREFLANG_PATHS = ["/", "/tours", "/excursions"];
const JSON_LD_SAMPLES = [
  { path: "/tours/patagonia-glaciers", types: ["Product"], label: "tour detail" },
  { path: null, types: ["TouristTrip", "Event"], label: "excursion detail", dynamic: "excursion" },
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

async function fetchText(urlPath) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    method: "GET",
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
    headers: { Accept: "text/html,application/xhtml+xml,application/xml" },
  });
  const text = await response.text();
  return { status: response.status, text, url: `${baseUrl}${urlPath}` };
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

function checkI18nSitemapPaths(sitemapPaths) {
  const pathnames = sitemapPaths.map(pathFromSitemapUrl);
  const issues = [];

  for (const basePath of HREFLANG_PATHS) {
    for (const locale of ["es", "en"]) {
      const prefixed = basePath === "/" ? `/${locale}` : `/${locale}${basePath}`;
      const found = pathnames.some((p) => p === prefixed || p === `${prefixed}/`);
      if (!found) {
        issues.push(`Sitemap missing i18n URL: ${prefixed}`);
      }
    }
  }

  return issues;
}

async function resolveExcursionSamplePath() {
  const { text, status } = await fetchText("/excursions");
  if (status !== 200) return null;

  const slugMatch = text.match(/href=["']\/excursions\/([^"'/?#]+)["']/i);
  return slugMatch ? `/excursions/${slugMatch[1]}` : null;
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

async function auditJsonLdSample(sample) {
  let pagePath = sample.path;

  if (sample.dynamic === "excursion") {
    pagePath = await resolveExcursionSamplePath();
    if (!pagePath) {
      return {
        label: sample.label,
        path: null,
        ok: false,
        issues: ["Could not resolve excursion sample slug from /excursions"],
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
    if (!types.has(expectedType)) {
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

function extractBreadcrumbNames(html) {
  const blocks = extractJsonLdBlocks(html);
  const names = [];

  for (const block of blocks) {
    if (block._parseError) continue;
    if (block["@type"] !== "BreadcrumbList") continue;
    for (const element of block.itemListElement ?? []) {
      if (element?.name) names.push(String(element.name));
    }
  }

  return names;
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

async function auditEnPlacesBreadcrumbs() {
  const issues = [];
  const { status, text } = await fetchText("/en/places");

  if (status !== 200) {
    return { path: "/en/places", ok: false, issues: [`HTTP ${status}`] };
  }

  const names = extractBreadcrumbNames(text);
  if (names.length === 0) {
    issues.push("/en/places: missing BreadcrumbList JSON-LD");
  } else if (names.includes("Главная")) {
    issues.push(`/en/places: breadcrumb still in Russian (${names.join(" › ")})`);
  } else if (!names.includes("Home")) {
    issues.push(`/en/places: expected English home crumb (found: ${names.join(" › ")})`);
  }

  return { path: "/en/places", ok: issues.length === 0, issues, breadcrumbNames: names };
}

async function main() {
  loadEnvLocal();
  fs.mkdirSync(opsDir, { recursive: true });

  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    sitemap: { urlCount: 0, statusIssues: [], i18nIssues: [] },
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
  let sitemapPaths = [];
  try {
    const sitemap = await fetchText("/sitemap.xml");
    assert(sitemap.status === 200, `GET /sitemap.xml returned ${sitemap.status}`);
    sitemapPaths = parseSitemapXml(sitemap.text);
    report.sitemap.urlCount = sitemapPaths.length;
    console.log(`✓ sitemap.xml — ${sitemapPaths.length} URLs`);

    const i18nIssues = checkI18nSitemapPaths(sitemapPaths);
    report.sitemap.i18nIssues = i18nIssues;
    for (const issue of i18nIssues) {
      report.ok = false;
      console.error(`✗ ${issue}`);
    }
    if (i18nIssues.length === 0) {
      console.log("✓ sitemap i18n paths (/es/, /en/) for homepage, tours, excursions");
    }

    const sampleSitemapChecks = sitemapPaths.slice(0, 20);
    for (const url of sampleSitemapChecks) {
      const pathname = pathFromSitemapUrl(url);
      const res = await fetchText(pathname);
      if (res.status !== 200) {
        const msg = `${pathname}: sitemap URL returned HTTP ${res.status}`;
        report.sitemap.statusIssues.push(msg);
        report.ok = false;
        console.error(`✗ ${msg}`);
      }
    }
    if (report.sitemap.statusIssues.length === 0) {
      console.log(`✓ first ${sampleSitemapChecks.length} sitemap URLs return 200`);
    }
  } catch (error) {
    report.ok = false;
    report.sitemap.error = error instanceof Error ? error.message : String(error);
    console.error(`✗ sitemap: ${report.sitemap.error}`);
    console.error("  Start dev server: npm run dev");
  }

  for (const pagePath of HREFLANG_PATHS) {
    const result = await auditPageMetadata(pagePath, true);
    report.metadata.push(result);
    if (result.ok) {
      console.log(`✓ metadata + hreflang: ${pagePath}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${issue}`);
    }
  }

  for (const sample of JSON_LD_SAMPLES) {
    const result = await auditJsonLdSample(sample);
    report.jsonLd.push(result);
    if (result.ok) {
      console.log(`✓ JSON-LD (${sample.label}): ${result.path}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${sample.label}: ${issue}`);
    }
  }

  for (const audit of [auditDestinationsHub, auditEnPlacesBreadcrumbs]) {
    const result = await audit();
    report.hubPages.push(result);
    if (result.ok) {
      console.log(`✓ hub page SEO: ${result.path}`);
    } else {
      report.ok = false;
      for (const issue of result.issues) console.error(`✗ ${issue}`);
    }
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

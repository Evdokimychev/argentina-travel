#!/usr/bin/env node
/**
 * I2 readiness: GTM env, search-engine verification meta, sitemap/robots on live host.
 *
 * Usage:
 *   npm run analytics-readiness
 *   ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
 *
 * Writes var/ops/analytics-readiness-last.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "analytics-readiness-last.json");

const GTM_ENV = "NEXT_PUBLIC_GTM_ID";
const ANALYTICS_ENV = [
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_YM_COUNTER_ID",
  "NEXT_PUBLIC_CLARITY_PROJECT_ID",
];
const VERIFICATION_ENV = [
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "NEXT_PUBLIC_BING_SITE_VERIFICATION",
  "NEXT_PUBLIC_AHREFS_SITE_VERIFICATION",
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

function summarize(checks) {
  const summary = { ok: 0, warn: 0, fail: 0, skip: 0 };
  for (const check of checks) summary[check.status] += 1;
  return summary;
}

async function fetchText(url, timeoutMs = 15000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "text/html,application/xhtml+xml,text/plain,application/xml" },
    redirect: "follow",
  });
  return { status: response.status, text: await response.text(), url: response.url };
}

function metaContent(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
    "i"
  );
  const match = html.match(re);
  return (match?.[1] ?? match?.[2] ?? "").trim();
}

async function checkCmsSeoVerification() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return {
      id: "cms:seo-verification",
      label: "CMS site.seo verification tokens",
      status: "skip",
      message: "Supabase env не задан — пропуск",
      category: "cms",
    };
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/site_settings?key=eq.site.seo&select=value`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return {
        id: "cms:seo-verification",
        label: "CMS site.seo verification tokens",
        status: "warn",
        message: `HTTP ${response.status}`,
        category: "cms",
      };
    }

    const rows = await response.json();
    const seo = rows[0]?.value ?? {};
    const set = [
      seo.googleSiteVerification && "google",
      seo.bingSiteVerification && "bing",
      seo.ahrefsSiteVerification && "ahrefs",
    ].filter(Boolean);

    return {
      id: "cms:seo-verification",
      label: "CMS site.seo verification tokens",
      status: set.length > 0 ? "ok" : "warn",
      message:
        set.length > 0
          ? `Заданы: ${set.join(", ")} (Admin → SEO или env)`
          : "Пусто — задайте в Vercel env или Admin → Настройки → SEO",
      category: "cms",
    };
  } catch (error) {
    return {
      id: "cms:seo-verification",
      label: "CMS site.seo verification tokens",
      status: "warn",
      message: error instanceof Error ? error.message : String(error),
      category: "cms",
    };
  }
}

async function main() {
  loadEnvLocal();

  const baseUrl = (
    process.env.ANALYTICS_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.goargentina.ru"
  ).replace(/\/$/, "");

  const checks = [];

  const gtmPresent = Boolean(process.env[GTM_ENV]?.trim());
  checks.push({
    id: "env:gtm",
    label: GTM_ENV,
    status: gtmPresent ? "ok" : "fail",
    message: gtmPresent ? process.env[GTM_ENV].trim() : "Не задан — GTM не загрузится",
    category: "env",
  });

  for (const key of ANALYTICS_ENV) {
    const present = Boolean(process.env[key]?.trim());
    checks.push({
      id: `env:${key}`,
      label: key,
      status: present ? "ok" : "warn",
      message: present ? "Задана (для тегов в GTM UI)" : "Не задана — справочно для настройки тегов",
      category: "env",
    });
  }

  const verificationEnvSet = VERIFICATION_ENV.filter((key) => process.env[key]?.trim());
  checks.push({
    id: "env:verification",
    label: "Verification env (GSC / Bing / Ahrefs)",
    status: verificationEnvSet.length >= 3 ? "ok" : verificationEnvSet.length > 0 ? "warn" : "fail",
    message:
      verificationEnvSet.length > 0
        ? `Задано ${verificationEnvSet.length}/3: ${verificationEnvSet.map((k) => k.replace("NEXT_PUBLIC_", "")).join(", ")}`
        : "Ни один токен не задан — meta-теги не появятся без CMS SEO globals",
    category: "env",
  });

  checks.push(await checkCmsSeoVerification());

  try {
    const home = await fetchText(`${baseUrl}/`);
    const googleMeta = metaContent(home.text, "google-site-verification");
    const bingMeta = metaContent(home.text, "msvalidate.01");
    const ahrefsMeta = metaContent(home.text, "ahrefs-site-verification");
    const hasGtm =
      /googletagmanager\.com/i.test(home.text) || /GTM-[A-Z0-9]+/.test(home.text);

    checks.push({
      id: "live:gtm",
      label: `Live GTM snippet (${baseUrl})`,
      status: hasGtm ? "ok" : "fail",
      message: hasGtm ? "googletagmanager.com найден в HTML" : "GTM не в HTML — проверьте env на хостинге и redeploy",
      category: "live",
    });

    checks.push({
      id: "live:google-verification",
      label: "Live google-site-verification",
      status: googleMeta ? "ok" : "fail",
      message: googleMeta ? `content=${googleMeta.slice(0, 12)}…` : "Meta-тег отсутствует",
      category: "live",
    });

    checks.push({
      id: "live:bing-verification",
      label: "Live msvalidate.01 (Bing)",
      status: bingMeta ? "ok" : "warn",
      message: bingMeta ? `content=${bingMeta.slice(0, 12)}…` : "Meta-тег отсутствует",
      category: "live",
    });

    checks.push({
      id: "live:ahrefs-verification",
      label: "Live ahrefs-site-verification",
      status: ahrefsMeta ? "ok" : "warn",
      message: ahrefsMeta ? `content=${ahrefsMeta.slice(0, 12)}…` : "Meta-тег отсутствует",
      category: "live",
    });

    const robots = await fetchText(`${baseUrl}/robots.txt`);
    const sitemapLine = robots.text.match(/^Sitemap:\s*(.+)$/im)?.[1]?.trim();
    const expectedSitemap = `${baseUrl}/sitemap.xml`;

    checks.push({
      id: "live:robots-sitemap",
      label: "robots.txt → Sitemap",
      status: robots.status === 200 && sitemapLine ? "ok" : "fail",
      message:
        robots.status === 200 && sitemapLine
          ? sitemapLine
          : `HTTP ${robots.status} или строка Sitemap отсутствует`,
      category: "live",
    });

    const sitemap = await fetchText(sitemapLine ?? `${baseUrl}/sitemap.xml`);
    const urlCount = (sitemap.text.match(/<loc>/g) ?? []).length;
    const domainOk = !sitemapLine || sitemapLine.startsWith(baseUrl);

    checks.push({
      id: "live:sitemap",
      label: "sitemap.xml доступен",
      status: sitemap.status === 200 && urlCount > 0 ? "ok" : "fail",
      message:
        sitemap.status === 200
          ? `${urlCount} URL${domainOk ? "" : " (проверьте домен в Sitemap:)"}`
          : `HTTP ${sitemap.status}`,
      category: "live",
    });

    checks.push({
      id: "manual:gsc-sitemap",
      label: "GSC: sitemap отправлен вручную",
      status: "skip",
      message: `Search Console → Sitemaps → ${expectedSitemap} (после верификации google-site-verification)`,
      category: "manual",
    });
  } catch (error) {
    checks.push({
      id: "live:fetch",
      label: `Live checks (${baseUrl})`,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
      category: "live",
    });
  }

  const summary = summarize(checks);
  const payload = {
    ok: summary.fail === 0,
    ranAt: new Date().toISOString(),
    baseUrl,
    checks,
    summary,
    runbook: "docs/i2-analytics-gsc-runbook.md",
  };

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Analytics readiness (I2)");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Checks: OK ${summary.ok}, warn ${summary.warn}, fail ${summary.fail}, skip ${summary.skip}`);
  console.log("");

  for (const check of checks) {
    const icon =
      check.status === "ok" ? "✓" : check.status === "fail" ? "✗" : check.status === "warn" ? "!" : "–";
    console.log(`${icon} [${check.status}] ${check.label}: ${check.message}`);
  }

  console.log("");
  console.log(`Report: ${path.relative(root, reportFile)}`);
  console.log("Runbook: docs/i2-analytics-gsc-runbook.md");

  if (summary.fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

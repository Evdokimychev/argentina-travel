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
import { resolveHealthyDeploymentGitSha } from "./lib/ops-report-evidence.mjs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "analytics-readiness-last.json");

const GTM_ENV = "NEXT_PUBLIC_GTM_ID";
const SITE_URL_ENV = "NEXT_PUBLIC_SITE_URL";
const EXPECTED_GTM_EVENTS_COUNT = 32;
const CONVERSIONS_RECOMMENDED = ["booking_submit", "contact_form_submit", "newsletter_subscribe"];
const ANALYTICS_ENV = [
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_YANDEX_METRIKA_ID",
  "NEXT_PUBLIC_CLARITY_PROJECT_ID",
];
const YM_ENV = "NEXT_PUBLIC_YANDEX_METRIKA_ID";
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

function extractGtmEventValues(source) {
  const objectBlock = source.match(/export const GTM_EVENTS = \{([\s\S]*?)\} as const;/);
  if (!objectBlock) return [];
  return [...new Set([...objectBlock[1].matchAll(/:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]))];
}

function countGtmEventsInCode() {
  const eventsFile = path.join(root, "src/lib/analytics/gtm-events.ts");
  const source = fs.readFileSync(eventsFile, "utf8");
  return extractGtmEventValues(source);
}

function hostFromUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function printGoLiveChecklist({ baseUrl, gtmEventsCount, summary, envGtmPresent, liveGtmOk }) {
  console.log("");
  console.log("GTM go-live checklist");
  console.log("=====================");
  console.log(`Vercel ${GTM_ENV}: ${envGtmPresent ? "задан локально/env" : "не задан"}`);
  console.log(`Live GTM snippet (${baseUrl}): ${liveGtmOk ? "да" : "нет"}`);
  console.log(`События dataLayer в коде: ${gtmEventsCount ?? "—"}`);
  console.log(`Автопроверки: OK ${summary.ok}, warn ${summary.warn}, fail ${summary.fail}`);
  console.log("");
  console.log("Ручные шаги:");
  console.log("  1. Vercel Production: NEXT_PUBLIC_GTM_ID + verification tokens → Redeploy");
  console.log("  2. GTM: GA4 Configuration + GA4 Event (regex в docs/analytics-gtm-setup.md)");
  console.log("  3. GTM: Consent Mode на всех тегах аналитики");
  console.log("  4. GA4: конверсии — booking_submit, contact_form_submit, newsletter_subscribe");
  console.log("  5. Метрика: цели по событиям dataLayer");
  console.log("  6. Submit + Publish контейнера в tagmanager.google.com");
  console.log("  7. Tag Assistant + GA4 DebugView после согласия на cookie");
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
  let gtmEventsCount = null;
  let liveGtmOk = false;
  let liveGitSha = null;

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
    const isYm = key === YM_ENV;
    checks.push({
      id: `env:${key}`,
      label: key,
      status: present ? "ok" : isYm ? "warn" : "warn",
      message: present
        ? isYm
          ? "Задана — счётчик загрузится в production"
          : "Задана (для тегов в GTM UI)"
        : isYm
          ? "Не задана — Метрика не загрузится"
          : "Не задана — справочно для настройки тегов",
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

  const siteUrl = process.env[SITE_URL_ENV]?.trim()?.replace(/\/$/, "") ?? "";
  const siteHost = siteUrl ? hostFromUrl(siteUrl) : null;
  const baseHost = hostFromUrl(baseUrl);
  checks.push({
    id: "env:site-url-host",
    label: `${SITE_URL_ENV} совпадает с baseUrl`,
    status: !siteHost ? "warn" : siteHost === baseHost ? "ok" : "fail",
    message: !siteHost
      ? "NEXT_PUBLIC_SITE_URL не задан — сравнение пропущено"
      : siteHost === baseHost
        ? `${siteHost} = ${baseHost}`
        : `Хост env (${siteHost}) ≠ baseUrl (${baseHost})`,
    category: "env",
  });

  try {
    const eventValues = countGtmEventsInCode();
    gtmEventsCount = eventValues.length;
    const unique = new Set(eventValues);
    checks.push({
      id: "code:gtm-events-count",
      label: "GTM_EVENTS в gtm-events.ts",
      status:
        unique.size === eventValues.length && eventValues.length === EXPECTED_GTM_EVENTS_COUNT
          ? "ok"
          : "fail",
      message:
        unique.size === eventValues.length
          ? `${eventValues.length} событий (ожидается ${EXPECTED_GTM_EVENTS_COUNT})`
          : `Дубликаты или неверное число: ${eventValues.length}`,
      category: "code",
    });
  } catch (error) {
    checks.push({
      id: "code:gtm-events-count",
      label: "GTM_EVENTS в gtm-events.ts",
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
      category: "code",
    });
  }

  try {
    const home = await fetchText(`${baseUrl}/`);
    const googleMeta = metaContent(home.text, "google-site-verification");
    const bingMeta = metaContent(home.text, "msvalidate.01");
    const ahrefsMeta = metaContent(home.text, "ahrefs-site-verification");

    try {
      const health = await fetchText(`${baseUrl}/api/health`);
      const healthJson = JSON.parse(health.text);
      const candidateGitSha =
        typeof healthJson?.gitSha === "string" && healthJson.gitSha.trim().length >= 7
          ? healthJson.gitSha.trim()
          : null;
      liveGitSha = resolveHealthyDeploymentGitSha(health.status, healthJson);
      checks.push({
        id: "live:deployment-binding",
        label: "Live deployment binding",
        status: liveGitSha ? "ok" : "fail",
        message: liveGitSha
          ? `gitSha=${liveGitSha.slice(0, 12)}, health HTTP ${health.status}`
          : `Deployment не готов: health HTTP ${health.status}, ok=${String(healthJson?.ok === true)}, gitSha=${candidateGitSha ? "present" : "missing"}`,
        category: "live",
      });
    } catch (error) {
      checks.push({
        id: "live:deployment-binding",
        label: "Live deployment binding",
        status: "fail",
        message: error instanceof Error ? error.message : String(error),
        category: "live",
      });
    }
    const hasConsentDefault =
      /id=["']gtm-consent-default["']/i.test(home.text) ||
      /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]default['"]/i.test(home.text);
    const hasDataLayerInit =
      /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]/i.test(home.text) ||
      /w\[l\]\s*=\s*w\[l\]\s*\|\|\s*\[\]/i.test(home.text);
    const hasExternalGtmLoader = /googletagmanager\.com\/gtm\.js/i.test(home.text);
    liveGtmOk = hasConsentDefault && hasDataLayerInit && !hasExternalGtmLoader;

    checks.push({
      id: "live:gtm",
      label: `Live GTM consent bootstrap (${baseUrl})`,
      status: liveGtmOk ? "ok" : "fail",
      message: liveGtmOk
        ? "denied-bootstrap готов; внешний gtm.js ожидаемо загружается только после согласия"
        : hasExternalGtmLoader
          ? "Внешний gtm.js найден до согласия пользователя"
          : "Consent/dataLayer bootstrap отсутствует — проверьте GTM env на хостинге и redeploy",
      category: "live",
    });

    const hasMetrika =
      /mc\.yandex\.ru\/metrika\/tag\.js/i.test(home.text) ||
      /mc\.yandex\.ru\/watch\//i.test(home.text);
    const ymEnvSet = Boolean(process.env[YM_ENV]?.trim());

    checks.push({
      id: "live:yandex-metrika",
      label: `Live Yandex Metrika pre-consent policy (${baseUrl})`,
      status: !ymEnvSet ? "skip" : hasMetrika ? "fail" : "warn",
      message: !ymEnvSet
        ? `${YM_ENV} не задан — проверка пропущена`
        : hasMetrika
          ? "Метрика найдена в сыром HTML до согласия пользователя"
          : "Pre-consent HTML чист; загрузку после согласия нужно подтвердить браузерной проверкой",
      category: "live",
    });

    checks.push({
      id: "live:gtm-consent-default",
      label: "Live Consent Mode default (gtm-consent-default)",
      status: hasConsentDefault ? "ok" : "fail",
      message: hasConsentDefault
        ? "Скрипт consent default найден в HTML"
        : "Consent default отсутствует — GTM может загрузиться до denied",
      category: "live",
    });

    checks.push({
      id: "live:datalayer-init",
      label: "Live dataLayer initialization",
      status: hasDataLayerInit ? "ok" : "fail",
      message: hasDataLayerInit
        ? "Инициализация dataLayer найдена"
        : "dataLayer не инициализирован в HTML",
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

    checks.push({
      id: "manual:gtm-publish",
      label: "GTM: контейнер опубликован",
      status: "skip",
      message: "Submit + Publish в tagmanager.google.com (GA4, Clarity). Метрика — в коде приложения, не в GTM.",
      category: "manual",
    });

    checks.push({
      id: "manual:ga4-conversions",
      label: "GA4 / Метрика: конверсии и цели",
      status: "skip",
      message: `Настроить: ${CONVERSIONS_RECOMMENDED.join(", ")}`,
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
  const generatedAt = new Date().toISOString();
  const payload = {
    ok: summary.fail === 0,
    generatedAt,
    ranAt: generatedAt,
    baseUrl,
    gitSha: liveGitSha,
    checks,
    summary,
    runbook: "docs/i2-analytics-gsc-runbook.md",
    gtmEventsCount,
    conversionsRecommended: CONVERSIONS_RECOMMENDED,
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
  printGoLiveChecklist({
    baseUrl,
    gtmEventsCount,
    summary,
    envGtmPresent: gtmPresent,
    liveGtmOk,
  });

  if (summary.fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

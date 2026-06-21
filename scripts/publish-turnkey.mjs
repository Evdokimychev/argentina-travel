#!/usr/bin/env node
/**
 * Turnkey pre-launch verification — aggregates all production gates.
 *
 * Usage:
 *   npm run publish:verify
 *   npm run publish:verify -- --url=https://www.goargentina.ru
 *   npm run publish:verify -- --full          # includes unit tests + local build
 *   npm run publish:verify -- --skip-build    # skip npm run build in --full mode
 *
 * Writes var/ops/publish-turnkey-last.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "publish-turnkey-last.json");

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

function parseArgs() {
  const argv = process.argv.slice(2);
  const urlArg = argv.find((arg) => arg.startsWith("--url="));
  const baseUrl = (
    urlArg?.slice("--url=".length) ??
    process.env.PUBLISH_BASE_URL ??
    process.env.SMOKE_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.goargentina.ru"
  ).replace(/\/$/, "");

  return {
    baseUrl,
    full: argv.includes("--full"),
    skipBuild: argv.includes("--skip-build"),
  };
}

function runStep(id, label, command, args, env = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const durationMs = Date.now() - started;

  return {
    id,
    label,
    command: `${command} ${args.join(" ")}`.trim(),
    status: result.status === 0 ? "ok" : "fail",
    exitCode: result.status ?? 1,
    durationMs,
    output: output.slice(-4000),
  };
}

function warnStep(id, label, message) {
  return { id, label, status: "warn", message };
}

function manualStep(id, label, message) {
  return { id, label, status: "manual", message };
}

async function fetchLiveHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    const json = await response.json();
    const issues = [];

    if (!json.ok) issues.push("ok !== true");
    if (json.environment?.deployEnv === "unknown") {
      issues.push("deployEnv=unknown (задайте DEPLOY_ENV=production в Vercel)");
    }
    if (!json.migrationVersion) {
      issues.push("migrationVersion пуст (после деплоя с migration-meta.generated.json исправится)");
    }
    if (!json.gitSha) {
      issues.push("gitSha пуст (Vercel подставит VERCEL_GIT_COMMIT_SHA после redeploy)");
    }

    return {
      id: "live:health",
      label: `Live /api/health (${baseUrl})`,
      status: response.status === 200 && json.ok && issues.length === 0 ? "ok" : issues.length ? "warn" : "fail",
      message:
        issues.length > 0
          ? issues.join("; ")
          : `deployEnv=${json.environment?.deployEnv}, migration=${json.migrationVersion}`,
      data: json,
    };
  } catch (error) {
    return {
      id: "live:health",
      label: `Live /api/health (${baseUrl})`,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  loadEnvLocal();
  const { baseUrl, full, skipBuild } = parseArgs();

  console.log("Publish turnkey verification");
  console.log(`Target: ${baseUrl}`);
  console.log("");

  const steps = [];

  steps.push(runStep("meta:migrations", "Migration meta", "node", ["scripts/write-migration-meta.mjs"]));

  steps.push(
    runStep("check:tsc", "TypeScript", "npx", ["tsc", "--noEmit"]),
    runStep("check:unit", "Unit tests", "npm", ["test"]),
    runStep("check:rls", "RLS audit", "node", ["scripts/rls-audit.mjs"]),
    runStep("check:blog-sync", "Blog MD sync", "npm", ["run", "sync-manual-posts:check"]),
    runStep("check:rich-sync", "Rich articles sync", "npm", ["run", "sync-rich-articles:check"]),
    runStep("check:heroes", "Blog heroes", "node", ["scripts/audit-blog-heroes.mjs", "--strict"]),
    runStep("check:cornerstone", "Cornerstone media", "npm", ["run", "register-cornerstone-media:check"]),
    runStep("check:redirects", "Content-plan redirects", "npm", ["run", "sync-content-plan-redirects:check"])
  );

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    steps.push(
      runStep("cms:readiness", "CMS cutover readiness", "npm", ["run", "cms:readiness", "--", "--strict"])
    );
  } else {
    steps.push(warnStep("cms:readiness", "CMS cutover readiness", "SUPABASE_SERVICE_ROLE_KEY не задан — пропуск"));
  }

  steps.push(
    runStep("smoke:production", "Production smoke", "node", ["scripts/production-smoke.mjs"], {
      SMOKE_BASE_URL: baseUrl,
    })
  );

  steps.push(await fetchLiveHealth(baseUrl));

  steps.push(
    (() => {
      const analytics = runStep(
        "analytics:readiness",
        "Analytics readiness (I2)",
        "node",
        ["scripts/analytics-readiness.mjs"],
        { ANALYTICS_BASE_URL: baseUrl }
      );
      if (analytics.status === "fail") {
        return {
          ...analytics,
          status: "warn",
          message: "GTM/verification не настроены — см. docs/i2-analytics-gsc-runbook.md (не блокирует контент)",
        };
      }
      return analytics;
    })()
  );

  if (full && !skipBuild) {
    steps.push(runStep("build:next", "Production build", "npm", ["run", "build"]));
  }

  steps.push(
    manualStep(
      "manual:vercel-env",
      "Vercel Production env",
      "DEPLOY_ENV=production, NEXT_PUBLIC_SITE_URL, Supabase keys, CRON_SECRET, NEXT_PUBLIC_GTM_ID, verification tokens — см. docs/production-launch-runbook.md"
    ),
    manualStep(
      "manual:gsc",
      "Google Search Console",
      "Верификация домена + sitemap https://www.goargentina.ru/sitemap.xml — docs/i2-analytics-gsc-runbook.md"
    ),
    manualStep(
      "manual:gtm-publish",
      "GTM container publish",
      "Настроить теги GA4/Метрика/Clarity и опубликовать контейнер — docs/analytics-gtm-setup.md"
    )
  );

  const summary = steps.reduce(
    (acc, step) => {
      acc[step.status] = (acc[step.status] ?? 0) + 1;
      return acc;
    },
    { ok: 0, warn: 0, fail: 0, manual: 0 }
  );

  const blocking = steps.filter((step) => step.status === "fail");

  const payload = {
    ok: blocking.length === 0,
    ranAt: new Date().toISOString(),
    baseUrl,
    full,
    summary,
    steps,
    runbook: "docs/production-launch-runbook.md",
  };

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  for (const step of steps) {
    const icon =
      step.status === "ok"
        ? "✓"
        : step.status === "fail"
          ? "✗"
          : step.status === "warn"
            ? "!"
            : step.status === "manual"
              ? "→"
              : "–";
    const detail = step.message ?? (step.exitCode === 0 ? "OK" : `exit ${step.exitCode}`);
    console.log(`${icon} [${step.status}] ${step.label}: ${detail}`);
  }

  console.log("");
  console.log(
    `Summary: OK ${summary.ok}, warn ${summary.warn}, fail ${summary.fail}, manual ${summary.manual}`
  );
  console.log(`Report: ${path.relative(root, reportFile)}`);
  console.log("Runbook: docs/production-launch-runbook.md");

  if (blocking.length > 0) {
    console.error("\nBlocking failures — исправьте перед публикацией.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

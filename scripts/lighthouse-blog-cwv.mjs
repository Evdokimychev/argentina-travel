#!/usr/bin/env node
/**
 * Lighthouse Core Web Vitals audit for blog sample URLs (S13).
 *
 * Requires a running site (build + start or dev).
 *
 * Usage:
 *   npm run build && npm run start &
 *   LIGHTHOUSE_BASE_URL=http://127.0.0.1:3000 node scripts/lighthouse-blog-cwv.mjs
 *
 * Env:
 *   LIGHTHOUSE_BASE_URL — default http://127.0.0.1:3000
 *   LIGHTHOUSE_SAMPLE_PATHS — comma-separated paths
 *   LIGHTHOUSE_CATEGORIES — comma-separated (default: performance)
 *   LIGHTHOUSE_REPORT_FILE — relative to var/ops (default: lighthouse-blog-cwv-last.json)
 *   SKIP_LIGHTHOUSE=1 — exit 0 without running (CI without server)
 *
 * Writes: var/ops/lighthouse-blog-cwv-last.json
 *
 * Cold-run model on CI: one long-lived headless Chrome for the suite, with
 * Lighthouse storage reset between navigations. Fresh Chrome process-per-run
 * exhausted GitHub-hosted runners after ~10 launches and then every later
 * sample timed out. Workers still isolate CDP in a child process so a hung
 * gather cannot wedge the parent; Chrome itself is owned by the parent and
 * only relaunched after a hard timeout.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch as launchChrome } from "chrome-launcher";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "./lib/candidate-evidence.mjs";
import {
  isLocalLighthouseBase,
  lighthouseBudgetForPath,
  summarizeLighthousePathRuns,
} from "./lib/lighthouse-budget-policy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportDir = path.join(root, "var/ops");
const reportFile = path.join(
  reportDir,
  process.env.LIGHTHOUSE_REPORT_FILE ?? "lighthouse-blog-cwv-last.json",
);
const BASE_URL = (process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const localBase = isLocalLighthouseBase(BASE_URL);
const evidenceScope = process.env.LIGHTHOUSE_EVIDENCE_SCOPE ?? "candidate";
const candidateContext = evidenceScope === "candidate" ? captureCandidateContext(root) : null;

const SAMPLE_PATHS = (process.env.LIGHTHOUSE_SAMPLE_PATHS?.split(",").map((p) => p.trim()).filter(Boolean) ??
  [
    "/blog",
    "/blog/authors",
    "/blog/hub/patagonia",
    "/blog/patagonia-packing-list",
    "/blog/argentinian-steak-guide",
    "/blog/natsionalnyy-park-iguasu",
  ]);

const CATEGORIES = (
  process.env.LIGHTHOUSE_CATEGORIES?.split(",").map((c) => c.trim()).filter(Boolean) ?? ["performance"]
);
const requestedRuns = Number(process.env.LIGHTHOUSE_RUNS_PER_PATH ?? 1);
const RUNS_PER_PATH = Number.isFinite(requestedRuns)
  ? Math.max(1, Math.min(5, Math.floor(requestedRuns)))
  : 1;
const requestedRunTimeoutMs = Number(process.env.LIGHTHOUSE_RUN_TIMEOUT_MS ?? 240_000);
const RUN_TIMEOUT_MS = Number.isFinite(requestedRunTimeoutMs)
  ? Math.max(30_000, Math.min(600_000, Math.floor(requestedRunTimeoutMs)))
  : 240_000;
const requestedCleanupDelayMs = Number(process.env.LIGHTHOUSE_CHROME_CLEANUP_DELAY_MS ?? 2_000);
const CHROME_CLEANUP_DELAY_MS = Number.isFinite(requestedCleanupDelayMs)
  ? Math.max(0, Math.min(15_000, Math.floor(requestedCleanupDelayMs)))
  : 2_000;
const configuredChromePort = Number(process.env.LIGHTHOUSE_CHROME_PORT);
const USE_CONFIGURED_CHROME = Number.isInteger(configuredChromePort) && configuredChromePort > 0;
const SINGLE_RUN_WORKER = path.join(__dirname, "lib/lighthouse-single-run.mjs");
const CHROME_FLAGS = ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"];
const reuseChrome =
  process.env.LIGHTHOUSE_REUSE_CHROME === "0"
    ? false
    : process.env.LIGHTHOUSE_REUSE_CHROME === "1" || !USE_CONFIGURED_CHROME;

/** Blocking public mobile budgets. Every cold run must complete; route medians gate CI. */
const BUDGET = {
  performance: Number(process.env.LIGHTHOUSE_PERF_BUDGET ?? (localBase ? 55 : 75)),
  accessibility: Number(process.env.LIGHTHOUSE_A11Y_BUDGET ?? 95),
  seo: Number(process.env.LIGHTHOUSE_SEO_BUDGET ?? 95),
  lcpMs: Number(process.env.LIGHTHOUSE_LCP_BUDGET_MS ?? (localBase ? 8_000 : 4_000)),
  cls: Number(process.env.LIGHTHOUSE_CLS_BUDGET ?? 0.1),
  tbtMs: Number(process.env.LIGHTHOUSE_TBT_BUDGET_MS ?? (localBase ? 2_500 : 300)),
  inpMs: 200,
  homeTransferBytes: Number(process.env.LIGHTHOUSE_HOME_TRANSFER_BUDGET_BYTES ?? 2_500_000),
  contentTransferBytes: Number(process.env.LIGHTHOUSE_CONTENT_TRANSFER_BUDGET_BYTES ?? 1_500_000),
  scriptTransferBytes: Number(process.env.LIGHTHOUSE_SCRIPT_TRANSFER_BUDGET_BYTES ?? 1_000_000),
};

if (process.env.SKIP_LIGHTHOUSE === "1") {
  console.log("SKIP_LIGHTHOUSE=1 — skipping Lighthouse blog CWV audit.");
  process.exit(0);
}

function probe(url) {
  try {
    const res = spawnSync(
      process.execPath,
      [
        "-e",
        `fetch(${JSON.stringify(url)}, { signal: AbortSignal.timeout(8000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))`,
      ],
      { stdio: "ignore", env: { ...process.env } },
    );
    return res.status === 0;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeLighthouseFailure(lh) {
  if (lh?.timedOut) return `lighthouse timed out after ${RUN_TIMEOUT_MS}ms`;
  if (lh?.error instanceof Error) return lh.error.message;
  if (typeof lh?.error === "string" && lh.error.trim()) return lh.error;
  return "lighthouse failed";
}

function killProcessTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Already exited.
    }
  }
}

function sweepOrphanedChrome() {
  spawnSync(
    "pkill",
    ["-9", "-f", "chrome.*--headless.*--remote-debugging-port"],
    { stdio: "ignore" },
  );
  spawnSync(
    "pkill",
    ["-9", "-f", "chrome-headless-shell"],
    { stdio: "ignore" },
  );
}

async function startSharedChrome() {
  return launchChrome({ chromeFlags: CHROME_FLAGS });
}

async function stopSharedChrome(chrome) {
  if (!chrome) return;
  try {
    chrome.kill();
  } catch {
    // Already dead.
  }
  sweepOrphanedChrome();
  await sleep(CHROME_CLEANUP_DELAY_MS);
}

/**
 * Run one Lighthouse sample in an isolated child process.
 * When chromePort is set, the worker attaches to the shared browser instead of
 * launching a fresh Chrome (avoids runner exhaustion after many cold launches).
 */
function runIsolatedColdAudit(url, outFile, chromePort) {
  return new Promise((resolve) => {
    fs.rmSync(outFile, { force: true });
    const child = spawn(process.execPath, [SINGLE_RUN_WORKER], {
      cwd: root,
      env: {
        ...process.env,
        LIGHTHOUSE_SINGLE_URL: url,
        LIGHTHOUSE_SINGLE_OUT: outFile,
        LIGHTHOUSE_CATEGORIES: CATEGORIES.join(","),
        ...(chromePort ? { LIGHTHOUSE_CHROME_PORT: String(chromePort) } : {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      killProcessTree(child.pid);
      fs.rmSync(outFile, { force: true });
      finish({ timedOut: true });
    }, RUN_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      finish({ error });
    });
    child.on("exit", (code, signal) => {
      if (fs.existsSync(outFile)) {
        try {
          const lhr = JSON.parse(fs.readFileSync(outFile, "utf8"));
          finish({ lhr, workerStdout: stdout.trim() });
          return;
        } catch (error) {
          finish({ error });
          return;
        }
      }
      if (signal) {
        finish({ error: `worker killed by ${signal}` });
        return;
      }
      finish({
        error:
          stderr.trim() ||
          stdout.trim() ||
          `lighthouse worker exited with code ${code ?? "unknown"}`,
      });
    });
  });
}

function writeSummaryReport(summary) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));
  console.log(`\nReport: ${path.relative(root, reportFile)}`);
}

if (!probe(`${BASE_URL}${SAMPLE_PATHS[0] ?? "/blog"}`)) {
  console.error(
    `Cannot reach ${BASE_URL}${SAMPLE_PATHS[0] ?? "/blog"} — start the server first (npm run build && npm run start).`,
  );
  console.error("Set SKIP_LIGHTHOUSE=1 to skip in CI without a running server.");
  process.exit(1);
}

// Never let a previous invalid-candidate artifact be uploaded as "this run".
fs.rmSync(reportFile, { force: true });

/** @type {Array<Record<string, any>>} */
const results = [];
let executionFailed = false;
let exitCode = 1;
/** @type {Awaited<ReturnType<typeof startSharedChrome>> | null} */
let sharedChrome = null;

try {
  if (reuseChrome && !USE_CONFIGURED_CHROME) {
    sharedChrome = await startSharedChrome();
    console.log(
      `Shared Chrome on debugging port ${sharedChrome.port} (storage reset between cold navigations)`,
    );
  }

  for (const samplePath of SAMPLE_PATHS) {
    for (let run = 1; run <= RUNS_PER_PATH; run += 1) {
      const url = `${BASE_URL}${samplePath}`;
      const outFile = path.join(
        reportDir,
        `lh-${samplePath.replace(/\//g, "_")}-run-${run}.json`,
      );

      console.log(`\nLighthouse (mobile, cold run ${run}/${RUNS_PER_PATH}): ${url}`);
      if (!probe(url)) {
        executionFailed = true;
        const message = `target not reachable before run: ${url}`;
        results.push({ path: samplePath, url, run, error: message, pass: false });
        console.log(`  FAIL error=${message}`);
        continue;
      }

      const chromePort = USE_CONFIGURED_CHROME
        ? configuredChromePort
        : sharedChrome?.port;
      let lh;
      try {
        lh = await runIsolatedColdAudit(url, outFile, chromePort);
      } catch (error) {
        executionFailed = true;
        const message = error instanceof Error ? error.message : String(error);
        results.push({ path: samplePath, url, run, error: message, pass: false });
        console.log(`  FAIL error=${message}`);
        if (sharedChrome) {
          await stopSharedChrome(sharedChrome);
          sharedChrome = await startSharedChrome();
        }
        continue;
      }

      if (!lh?.lhr) {
        executionFailed = true;
        const error = describeLighthouseFailure(lh);
        results.push({ path: samplePath, url, run, error, pass: false });
        console.log(`  FAIL error=${error}`);
        if (sharedChrome) {
          // Hung gather leaves the shared browser unusable; recycle it before
          // the next sample so later routes are not stuck behind a dead CDP.
          await stopSharedChrome(sharedChrome);
          sharedChrome = await startSharedChrome();
        }
        continue;
      }

      const report = lh.lhr;
      const perfScore = Math.round((report.categories?.performance?.score ?? 0) * 100);
      const a11yScore = CATEGORIES.includes("accessibility")
        ? Math.round((report.categories?.accessibility?.score ?? 0) * 100)
        : null;
      const seoScore = CATEGORIES.includes("seo")
        ? Math.round((report.categories?.seo?.score ?? 0) * 100)
        : null;
      const audits = report.audits ?? {};

      const lcpMs = audits["largest-contentful-paint"]?.numericValue ?? Infinity;
      const cls = audits["cumulative-layout-shift"]?.numericValue ?? Infinity;
      const tbtMs = audits["total-blocking-time"]?.numericValue ?? Infinity;
      const transferBytes = audits["total-byte-weight"]?.numericValue ?? Infinity;
      const scriptTransferBytes = Array.isArray(audits["network-requests"]?.details?.items)
        ? audits["network-requests"].details.items
            .filter((item) => item.resourceType === "Script")
            .reduce((sum, item) => sum + Number(item.transferSize ?? 0), 0)
        : Infinity;
      const routeBudget = lighthouseBudgetForPath(BUDGET, samplePath, { local: localBase });
      const transferBudget = routeBudget.transferBytes;
      const inpMs =
        audits["interaction-to-next-paint"]?.numericValue ??
        audits["experimental-interaction-to-next-paint"]?.numericValue ??
        null;

      const perfPass =
        !CATEGORIES.includes("performance") ||
        (perfScore >= routeBudget.performance &&
          lcpMs <= routeBudget.lcpMs &&
          cls <= routeBudget.cls &&
          tbtMs <= routeBudget.tbtMs &&
          transferBytes <= transferBudget &&
          scriptTransferBytes <= routeBudget.scriptTransferBytes &&
          (inpMs == null || inpMs <= routeBudget.inpMs));
      const a11yPass = a11yScore == null || a11yScore >= routeBudget.accessibility;
      const seoPass = seoScore == null || seoScore >= routeBudget.seo;

      const row = {
        path: samplePath,
        url,
        run,
        performance: CATEGORIES.includes("performance") ? perfScore : null,
        accessibility: a11yScore,
        seo: seoScore,
        lcpMs: Math.round(lcpMs),
        cls: Number(cls.toFixed(3)),
        tbtMs: Math.round(tbtMs),
        transferBytes: Math.round(transferBytes),
        transferBudgetBytes: transferBudget,
        scriptTransferBytes: Math.round(scriptTransferBytes),
        inpMs: inpMs != null ? Math.round(inpMs) : null,
        pass: perfPass && a11yPass && seoPass,
      };

      results.push(row);

      const status = row.pass ? "PASS" : "FAIL";
      console.log(
        `  ${status}` +
          (row.performance != null ? ` perf=${row.performance}` : "") +
          (row.accessibility != null ? ` a11y=${row.accessibility}` : "") +
          (row.seo != null ? ` seo=${row.seo}` : "") +
          ` LCP=${row.lcpMs}ms CLS=${row.cls} TBT=${row.tbtMs}ms` +
          ` transfer=${Math.round(row.transferBytes / 1024)}KB` +
          ` scripts=${Math.round(row.scriptTransferBytes / 1024)}KB` +
          (row.inpMs != null ? ` INP=${row.inpMs}ms` : ""),
      );
    }
  }

  const seoBlocking = CATEGORIES.includes("seo") && !localBase;
  const pathSummaries = SAMPLE_PATHS.map((samplePath) =>
    summarizeLighthousePathRuns({
      path: samplePath,
      runs: results.filter((row) => row.path === samplePath),
      requiredRuns: RUNS_PER_PATH,
      budget: lighthouseBudgetForPath(BUDGET, samplePath, { local: localBase }),
      seoBlocking,
    }),
  );

  const perfScores = results
    .filter((r) => typeof r.performance === "number")
    .map((r) => r.performance);
  const a11yScores = results
    .filter((r) => typeof r.accessibility === "number")
    .map((r) => r.accessibility);
  const seoScores = results
    .filter((r) => typeof r.seo === "number")
    .map((r) => r.seo);

  function median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  const medianPerf = median(perfScores);
  const medianA11y = median(a11yScores);
  const medianSeo = median(seoScores);
  const gitSha =
    process.env.GIT_SHA?.trim() ||
    spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout?.trim() ||
    null;
  const gitStatus = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  }).stdout?.trim();
  const dirty = Boolean(gitStatus);

  const summary = {
    at: new Date().toISOString(),
    gitSha,
    dirty,
    evidenceScope,
    evidenceEnvironment:
      process.env.EVIDENCE_ENVIRONMENT ??
      (evidenceScope === "candidate" ? "local-production" : "production-baseline"),
    evidenceBaseUrl: BASE_URL,
    deploymentId: process.env.EVIDENCE_DEPLOYMENT_ID ?? null,
    deployedTree: process.env.EVIDENCE_DEPLOYED_TREE ?? null,
    baseUrl: BASE_URL,
    categories: CATEGORIES,
    runsPerPath: RUNS_PER_PATH,
    device: reuseChrome
      ? "Lighthouse mobile / simulated throttling / shared Chrome + storage-reset cold navigations"
      : "Lighthouse mobile / simulated throttling / isolated cold Chrome worker per run",
    budget: BUDGET,
    medianPerformance: medianPerf,
    medianAccessibility: medianA11y || null,
    medianSeo: medianSeo || null,
    results,
    aggregation: "per-route median across complete cold runs",
    seoBlocking,
    pathSummaries,
    pass:
      !executionFailed && pathSummaries.every((pathSummary) => pathSummary.pass),
  };
  if (candidateContext) {
    const evidence = finalizeCandidateEvidence(root, candidateContext, {
      environment: summary.evidenceEnvironment,
      baseUrl: BASE_URL,
    });
    Object.assign(summary, evidence);
    if (evidence.evidenceIntegrity.status !== "passed") summary.pass = false;
  }

  writeSummaryReport(summary);
  if (perfScores.length) {
    console.log(`Median Performance: ${medianPerf} (budget ≥ ${BUDGET.performance})`);
  }
  if (a11yScores.length) {
    console.log(`Median Accessibility: ${medianA11y} (budget ≥ ${BUDGET.accessibility})`);
  }
  if (seoScores.length) {
    console.log(`Median SEO: ${medianSeo} (budget ≥ ${BUDGET.seo})`);
  }

  exitCode = summary.pass ? 0 : 1;
} catch (error) {
  executionFailed = true;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Lighthouse harness crashed: ${message}`);
  const fallback = {
    at: new Date().toISOString(),
    gitSha: process.env.GIT_SHA?.trim() || null,
    dirty: true,
    evidenceScope: "invalid-candidate",
    evidenceEnvironment:
      process.env.EVIDENCE_ENVIRONMENT ??
      (evidenceScope === "candidate" ? "local-production" : "production-baseline"),
    evidenceBaseUrl: BASE_URL,
    results,
    pass: false,
    error: message,
  };
  writeSummaryReport(fallback);
  exitCode = 1;
} finally {
  await stopSharedChrome(sharedChrome);
  sharedChrome = null;
}

process.exit(exitCode);

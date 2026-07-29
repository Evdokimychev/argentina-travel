#!/usr/bin/env node
/**
 * Aggregated project readiness scorecard from ops reports.
 *
 * Run after:
 *   npm run publish:verify
 *   ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
 *   npm run lighthouse:phase2   (optional)
 *
 * Usage:
 *   npm run project:readiness
 *   npm run project:readiness -- --refresh   # re-run publish:verify first
 *
 * Writes var/ops/project-readiness-last.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateOpsReportEvidence } from "./lib/ops-report-evidence.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = process.env.PROJECT_READINESS_REPORT_FILE
  ? path.resolve(process.env.PROJECT_READINESS_REPORT_FILE)
  : path.join(opsDir, "project-readiness-last.json");
const DEFAULT_PRODUCTION_URL = "https://www.goargentina.ru";

function readJson(relPath) {
  const full = path.join(opsDir, relPath);
  if (!fs.existsSync(full)) return null;
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch {
    return null;
  }
}

function clamp(n, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function scorePublish(publish) {
  if (!publish?.summary) return { score: null, note: "нет publish-turnkey-last.json — npm run publish:verify" };
  const { ok = 0, warn = 0, fail = 0 } = publish.summary;
  const automated = ok + warn + fail;
  if (automated === 0) return { score: null, note: "пустой publish report" };
  const ratio = fail === 0 ? (ok + warn * 0.85) / automated : ok / automated * 0.5;
  return {
    score: clamp(ratio * 10, 0, 10),
    note: `OK ${ok}, warn ${warn}, fail ${fail}`,
  };
}

function scoreAnalytics(analytics) {
  if (!analytics?.summary) return { score: null, note: "нет analytics-readiness-last.json", manual: true };
  const { ok = 0, warn = 0, fail = 0, skip = 0 } = analytics.summary;
  const failedChecks = (analytics.checks ?? []).filter((c) => c.status === "fail");
  const opsOnlyFailIds = new Set([
    "env:gtm",
    "env:verification",
    "live:gtm",
    "live:google-verification",
    "manual:gtm-publish",
    "manual:ga4-conversions",
  ]);
  const envOnly =
    fail > 0 &&
    failedChecks.every((c) =>
      opsOnlyFailIds.has(c.id) ||
      /env|GTM|verification|Live GTM|google-site-verification/i.test(String(c.label ?? c.id ?? "")),
    );
  if (envOnly) {
    return {
      score: null,
      manual: true,
      note: `ops-only: OK ${ok}, fail ${fail} (Vercel env + GTM publish + ручные конверсии)`,
    };
  }
  const weighted = ok * 1 + warn * 0.5 + skip * 0.25;
  const total = ok + warn + fail + skip || 1;
  const penalty = fail * 1.5;
  return {
    score: clamp((weighted / total) * 10 - penalty, 0, 10),
    manual: false,
    note: fail > 0 ? `OK ${ok}, warn ${warn}, fail ${fail} — блокеры аналитики` : `OK ${ok}, warn ${warn}, fail ${fail}`,
  };
}

function scoreCms(cms) {
  if (!cms) return { score: null, note: "нет cms-cutover-readiness-last.json" };
  const summary = cms.summary;
  if (summary?.lanesAt100 != null && summary?.lanesEnabled != null) {
    const ratio = summary.lanesAt100 / summary.lanesEnabled;
    const cutoverBonus = summary.allCutover ? 0.5 : 0;
    return {
      score: clamp(ratio * 10 + cutoverBonus, 0, 10),
      note: `${summary.lanesAt100}/${summary.lanesEnabled} lanes @100%, cutover=${summary.allCutover}`,
    };
  }
  const readiness = cms.readiness ?? {};
  const entries = Object.values(readiness);
  if (entries.length === 0) return { score: null, note: "readiness пуст" };
  const avg = entries.reduce((sum, lane) => sum + (lane.coveragePercent ?? 0), 0) / entries.length / 10;
  const cutoverBonus = entries.every((l) => l.cutover) ? 0.5 : 0;
  return {
    score: clamp(avg + cutoverBonus, 0, 10),
    note: `${entries.filter((l) => l.cutover).length}/${entries.length} cutover, avg ${Math.round(avg * 10)}%`,
  };
}

function scoreLighthouse(lh) {
  if (!lh) return { score: null, note: "нет lighthouse report (npm run lighthouse:phase2:prod)" };
  const perf = lh.medianPerformance ?? 0;
  const a11y = lh.medianAccessibility ?? 0;
  const budget = lh.budget ?? { performance: 90, accessibility: 95 };
  const perfRatio = perf / budget.performance;
  const a11yRatio = a11y / budget.accessibility;
  const clsWorst = Math.max(...(lh.results ?? []).map((r) => r.cls ?? 0), 0);
  const clsPenalty = clsWorst > 0.1 ? (clsWorst - 0.1) * 5 : 0;
  const raw = (perfRatio * 0.55 + a11yRatio * 0.45) * 10 - clsPenalty;
  const source = lh.baseUrl?.includes("goargentina") ? "prod CDN" : "local lab";
  return {
    score: clamp(raw, 0, 10),
    note: `median perf ${perf}, a11y ${a11y}, worst CLS ${clsWorst.toFixed(3)} (${source})`,
  };
}

function readLighthouseReport() {
  return readJson("lighthouse-phase2-prod-last.json");
}

function rejectedDimension(label, validation) {
  return {
    score: null,
    manual: true,
    note: `${label}: ${validation.reasons.join(", ")}`,
  };
}

async function fetchLiveHealth(baseUrl) {
  if (process.env.PROJECT_READINESS_SKIP_LIVE === "1") {
    return { reachable: false, ok: false, httpStatus: null, status: "skipped", gitSha: null };
  }

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });
    const body = await response.json().catch(() => null);
    const gitSha =
      typeof body?.gitSha === "string" && body.gitSha.trim().length >= 7
        ? body.gitSha.trim()
        : null;
    return {
      reachable: true,
      ok: response.status === 200 && body?.ok === true,
      httpStatus: response.status,
      status: body?.status ?? null,
      gitSha,
    };
  } catch {
    return { reachable: false, ok: false, httpStatus: null, status: "unreachable", gitSha: null };
  }
}

function scoreProduction(publish, publishEvidence, liveHealth, baseUrl) {
  if (!liveHealth.reachable) {
    return { score: null, manual: true, note: `${baseUrl}: live health недоступен` };
  }
  if (!liveHealth.ok) {
    return {
      score: 0,
      note: `${baseUrl}: HTTP ${liveHealth.httpStatus}, status=${liveHealth.status ?? "unknown"}`,
    };
  }
  if (!publishEvidence.valid) return rejectedDimension("publish evidence отклонён", publishEvidence);

  const smokeOk = publish?.steps?.find((step) => step.id === "smoke:production")?.status === "ok";
  const liveOk = publish?.steps?.find((step) => step.id === "live:health")?.status === "ok";
  return {
    score: smokeOk && liveOk ? 10 : smokeOk ? 9 : null,
    note: smokeOk ? `${baseUrl}: live health + свежий publish evidence` : "production smoke не подтверждён",
  };
}

function overallScore(dimensions) {
  const weights = {
    code: 0.35,
    cms: 0.2,
    production: 0.25,
    analytics: 0.1,
    performance: 0.1,
  };
  let sum = 0;
  let weight = 0;
  for (const [key, w] of Object.entries(weights)) {
    const dim = dimensions[key];
    if (dim?.manual) continue;
    if (dim?.score != null) {
      sum += dim.score * w;
      weight += w;
    }
  }
  return weight > 0 ? clamp(sum / weight, 0, 10) : null;
}

function grade(score) {
  if (score == null) return "—";
  if (score >= 9) return "A";
  if (score >= 8) return "B+";
  if (score >= 7) return "B";
  if (score >= 6) return "C+";
  if (score >= 5) return "C";
  return "D";
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  if (refresh) {
    console.log("Refreshing publish:verify…\n");
    const result = spawnSync("npm", ["run", "publish:verify"], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    if (result.status !== 0) {
      console.warn("publish:verify exited non-zero — scoring from last reports\n");
    }
  }

  const publish = readJson("publish-turnkey-last.json");
  const analytics = readJson("analytics-readiness-last.json");
  const cms = readJson("cms-cutover-readiness-last.json");
  const lighthouse = readLighthouseReport();
  const baseUrl = (
    process.env.PROJECT_READINESS_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_PRODUCTION_URL
  ).replace(/\/$/, "");
  const liveHealth = await fetchLiveHealth(baseUrl);

  const deploymentEvidenceOptions = {
    expectedBaseUrl: baseUrl,
    expectedGitSha: liveHealth.gitSha,
    requireBaseUrl: true,
    requireGitSha: true,
    requireExpectedGitSha: true,
    requireGeneratedAt: true,
  };
  const evidence = {
    publish: validateOpsReportEvidence(publish, deploymentEvidenceOptions),
    analytics: validateOpsReportEvidence(analytics, deploymentEvidenceOptions),
    cms: validateOpsReportEvidence(cms, { requireGeneratedAt: true }),
    lighthouse: validateOpsReportEvidence(lighthouse, deploymentEvidenceOptions),
  };

  const dimensions = {
    code: evidence.publish.valid
      ? scorePublish(publish)
      : rejectedDimension("publish evidence отклонён", evidence.publish),
    cms: evidence.cms.valid
      ? scoreCms(cms)
      : rejectedDimension("CMS evidence отклонён", evidence.cms),
    production: scoreProduction(publish, evidence.publish, liveHealth, baseUrl),
    analytics: evidence.analytics.valid
      ? scoreAnalytics(analytics)
      : rejectedDimension("analytics evidence отклонён", evidence.analytics),
    performance: evidence.lighthouse.valid
      ? scoreLighthouse(lighthouse)
      : rejectedDimension("Lighthouse evidence отклонён", evidence.lighthouse),
  };

  const overall = overallScore(dimensions);
  const generatedAt = new Date().toISOString();
  const payload = {
    schemaVersion: 2,
    generatedAt,
    ranAt: generatedAt,
    baseUrl,
    gitSha: liveHealth.gitSha,
    overall: overall != null ? Math.round(overall * 10) / 10 : null,
    grade: grade(overall),
    dimensions: Object.fromEntries(
      Object.entries(dimensions).map(([k, v]) => [k, { ...v, score: v.score != null ? Math.round(v.score * 10) / 10 : null }])
    ),
    blockers: [],
    manualNext: [
      "Vercel: NEXT_PUBLIC_GTM_ID + verification tokens → redeploy",
      "GTM: опубликовать контейнер (GA4, Метрика, Clarity)",
      "GSC: верификация + sitemap",
      "Visual sign-off S11 (375/768/1280/1440)",
      "Lighthouse perf sprint (local lab median ~59 vs budget 90)",
      "F2 i18n globals ES/EN (E77)",
    ],
    evidence: {
      liveHealth,
      reports: {
        publish: { path: "var/ops/publish-turnkey-last.json", ...evidence.publish },
        analytics: { path: "var/ops/analytics-readiness-last.json", ...evidence.analytics },
        cms: { path: "var/ops/cms-cutover-readiness-last.json", ...evidence.cms },
        lighthouse: { path: "var/ops/lighthouse-phase2-prod-last.json", ...evidence.lighthouse },
      },
    },
  };

  if (!liveHealth.reachable) {
    payload.blockers.push("production health is not reachable");
  } else if (!liveHealth.ok) {
    payload.blockers.push(`production health is ${liveHealth.status ?? `HTTP ${liveHealth.httpStatus}`}`);
  }
  for (const [name, validation] of Object.entries(evidence)) {
    if (!validation.valid) payload.blockers.push(`${name} evidence rejected: ${validation.reasons.join(", ")}`);
  }
  if (evidence.publish.valid && publish?.summary?.fail > 0) {
    payload.blockers.push("publish:verify has blocking failures");
  } else if (evidence.analytics.valid && analytics?.summary?.fail > 0 && !payload.dimensions.analytics?.manual) {
    payload.blockers.push(`analytics: ${analytics.summary.fail} blocking failure(s)`);
  }

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Project readiness scorecard");
  console.log("===========================\n");
  if (overall != null) {
    console.log(`Overall: ${payload.overall}/10 (${payload.grade})\n`);
  }
  for (const [key, dim] of Object.entries(payload.dimensions)) {
    const label = key.padEnd(12);
    const score = dim.manual ? "manual" : dim.score != null ? `${dim.score}/10` : "n/a";
    console.log(`${label} ${score}  — ${dim.note}`);
  }
  if (payload.blockers.length) {
    console.log("\nBlockers:");
    for (const b of payload.blockers) console.log(`  • ${b}`);
  }
  console.log("\nManual next steps:");
  for (const step of payload.manualNext) console.log(`  → ${step}`);
  console.log(`\nReport: ${path.relative(root, reportFile)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

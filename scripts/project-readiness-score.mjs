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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "project-readiness-last.json");

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
  if (!analytics?.summary) return { score: null, note: "нет analytics-readiness-last.json" };
  const { ok = 0, warn = 0, fail = 0, skip = 0 } = analytics.summary;
  const weighted = ok * 1 + warn * 0.5 + skip * 0.25;
  const total = ok + warn + fail + skip || 1;
  const penalty = fail * 1.5;
  return {
    score: clamp((weighted / total) * 10 - penalty, 0, 10),
    note: `OK ${ok}, warn ${warn}, fail ${fail}`,
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
  if (!lh) return { score: null, note: "нет lighthouse-phase2-sample-last.json (npm run lighthouse:phase2)" };
  const perf = lh.medianPerformance ?? 0;
  const a11y = lh.medianAccessibility ?? 0;
  const budget = lh.budget ?? { performance: 90, accessibility: 95 };
  const perfRatio = perf / budget.performance;
  const a11yRatio = a11y / budget.accessibility;
  const clsWorst = Math.max(...(lh.results ?? []).map((r) => r.cls ?? 0), 0);
  const clsPenalty = clsWorst > 0.1 ? (clsWorst - 0.1) * 5 : 0;
  const raw = (perfRatio * 0.55 + a11yRatio * 0.45) * 10 - clsPenalty;
  return {
    score: clamp(raw, 0, 10),
    note: `median perf ${perf}, a11y ${a11y}, worst CLS ${clsWorst.toFixed(3)} (local lab)`,
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

function main() {
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
  const lighthouse = readJson("lighthouse-phase2-sample-last.json");

  const dimensions = {
    code: scorePublish(publish),
    cms: scoreCms(cms),
    production: {
      score:
        publish?.steps?.find((s) => s.id === "smoke:production")?.status === "ok" &&
        publish?.steps?.find((s) => s.id === "live:health")?.status === "ok"
          ? 10
          : publish?.steps?.find((s) => s.id === "smoke:production")?.status === "ok"
            ? 9
            : null,
      note: publish?.baseUrl ?? "https://www.goargentina.ru",
    },
    analytics: scoreAnalytics(analytics),
    performance: scoreLighthouse(lighthouse),
  };

  const overall = overallScore(dimensions);
  const payload = {
    ranAt: new Date().toISOString(),
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
    reports: {
      publish: "var/ops/publish-turnkey-last.json",
      analytics: "var/ops/analytics-readiness-last.json",
      cms: "var/ops/cms-cutover-readiness-last.json",
      lighthouse: "var/ops/lighthouse-phase2-sample-last.json",
    },
  };

  if (publish?.summary?.fail > 0) {
    payload.blockers.push("publish:verify has blocking failures");
  }
  if (analytics?.summary?.fail > 0) {
    payload.blockers.push("analytics: GTM/GSC env not configured on production");
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
    const score = dim.score != null ? `${dim.score}/10` : "n/a";
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

main();

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  getCiEvidenceDir,
  resolveCiEvidenceContext,
  writeNotExecutedEvidence,
} from "./lib/release-gate-artifact.mjs";

const STALE_LH_PATTERNS = [/^lighthouse-phase2-.*-last\.json$/, /^lh-.*\.json$/];

function cleanStalePerformanceArtifacts(root) {
  const opsDir = path.join(root, "var/ops");
  if (!fs.existsSync(opsDir)) return;
  for (const name of fs.readdirSync(opsDir)) {
    if (STALE_LH_PATTERNS.some((pattern) => pattern.test(name))) {
      fs.rmSync(path.join(opsDir, name), { force: true });
    }
  }
}

function stageCurrentPerformanceArtifacts(root, env = process.env) {
  const context = resolveCiEvidenceContext(env);
  const evidenceDir = getCiEvidenceDir(root, env);
  const performanceDir = path.join(evidenceDir, "performance");
  fs.mkdirSync(performanceDir, { recursive: true });

  const opsDir = path.join(root, "var/ops");
  const staged = [];
  if (fs.existsSync(opsDir)) {
    for (const name of fs.readdirSync(opsDir)) {
      if (!STALE_LH_PATTERNS.some((pattern) => pattern.test(name))) continue;
      const source = path.join(opsDir, name);
      const target = path.join(performanceDir, name);
      fs.copyFileSync(source, target);

      try {
        const report = JSON.parse(fs.readFileSync(target, "utf8"));
        if (report && typeof report === "object") {
          if (context.commitSha && report.commitSha && report.commitSha !== context.commitSha) {
            fs.rmSync(target, { force: true });
            continue;
          }
          if (!report.commitSha && context.commitSha) {
            report.commitSha = context.commitSha;
            report.runId = context.runId;
            report.generatedAt = report.generatedAt ?? new Date().toISOString();
            fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
          }
        }
      } catch {
        // binary/non-json lighthouse dumps are still staged as current-run files
      }
      staged.push(path.relative(root, target));
    }
  }

  if (staged.length === 0) {
    const markerPath = writeNotExecutedEvidence(root, {
      env,
      group: "performance",
    });
    return { staged: false, markerPath };
  }

  const manifest = {
    commitSha: context.commitSha,
    runId: context.runId,
    branch: context.branch,
    group: "performance",
    generatedAt: new Date().toISOString(),
    status: "passed",
    stagedFiles: staged,
  };
  fs.writeFileSync(
    path.join(performanceDir, "evidence-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return { staged: true, stagedFiles: staged, performanceDir };
}

const root = process.cwd();
const mode = process.argv.includes("--prepare")
  ? "prepare"
  : process.argv.includes("--stage")
    ? "stage"
    : null;

if (mode === "prepare") {
  cleanStalePerformanceArtifacts(root);
  console.log("Prepared clean performance evidence workspace.");
  process.exit(0);
}

if (mode === "stage") {
  const result = stageCurrentPerformanceArtifacts(root);
  if (!result.staged) {
    console.log("Performance gate did not execute; staged NOT_EXECUTED marker.");
    process.exit(0);
  }
  console.log(`Performance evidence staged (${result.stagedFiles.length} files).`);
  process.exit(0);
}

console.error("Usage: node scripts/stage-performance-artifact.mjs --prepare|--stage");
process.exit(2);

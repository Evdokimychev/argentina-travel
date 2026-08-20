import fs from "node:fs";
import path from "node:path";

const STALE_REPORT_PATTERN = /^release-gate(?:-.+)?-last\.json$/;

export function resolveCiEvidenceContext(env = process.env) {
  const runId = String(env.GITHUB_RUN_ID ?? env.EVIDENCE_RUN_ID ?? "local").trim();
  const commitSha = String(env.GITHUB_SHA ?? env.GIT_SHA ?? "").trim() || null;
  const branch = String(env.GITHUB_REF_NAME ?? env.GITHUB_HEAD_REF ?? "").trim() || null;
  return { runId, commitSha, branch };
}

export function getCiEvidenceDir(root, env = process.env) {
  const { runId, commitSha } = resolveCiEvidenceContext(env);
  const shaSegment = commitSha ?? "unknown-sha";
  return path.join(root, "var/ops/ci", runId, shaSegment);
}

export function cleanStaleReleaseGateArtifacts(root) {
  const opsDir = path.join(root, "var/ops");
  if (!fs.existsSync(opsDir)) return;

  for (const name of fs.readdirSync(opsDir)) {
    if (name === "release-gate-report.json" || STALE_REPORT_PATTERN.test(name)) {
      fs.rmSync(path.join(opsDir, name), { force: true });
    }
  }

  const logsDir = path.join(opsDir, "release-gate-logs");
  if (fs.existsSync(logsDir)) {
    fs.rmSync(logsDir, { recursive: true, force: true });
  }
}

export function readReleaseGateReport(root, groupLabel) {
  const candidates = [
    path.join(root, "var/ops", "release-gate-report.json"),
    path.join(root, "var/ops", `release-gate-${groupLabel}-last.json`),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    } catch {
      return null;
    }
  }

  return null;
}

export function validateReleaseGateEvidence(report, options = {}) {
  const reasons = [];
  const expectedSha = options.commitSha?.trim() ?? null;
  const expectedRunId = options.runId?.trim() ?? null;

  if (!report || typeof report !== "object") {
    reasons.push("missing-report");
    return { valid: false, reasons };
  }

  if (report.status === "CURRENT_RUN_NOT_EXECUTED") {
    if (expectedSha && report.commitSha !== expectedSha) reasons.push("commit-sha-mismatch");
    if (expectedRunId && report.runId !== expectedRunId) reasons.push("run-id-mismatch");
    return { valid: reasons.length === 0, reasons };
  }

  if (!report.commitSha) reasons.push("missing-commit-sha");
  if (expectedSha && report.commitSha !== expectedSha) reasons.push("commit-sha-mismatch");

  const boundRunId = report.ciRunId ?? report.runId ?? null;
  if (expectedRunId && boundRunId && boundRunId !== expectedRunId) {
    reasons.push("run-id-mismatch");
  }

  if (!report.timestamp && !report.evidenceGeneratedAt) {
    reasons.push("missing-timestamp");
  }

  if (report.evidenceIntegrity?.status === "rejected") {
    reasons.push("evidence-integrity-rejected");
  }

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

export function writeNotExecutedEvidence(root, options = {}) {
  const env = options.env ?? process.env;
  const { runId, commitSha, branch } = resolveCiEvidenceContext(env);
  const evidenceDir = getCiEvidenceDir(root, env);
  fs.mkdirSync(evidenceDir, { recursive: true });

  const payload = {
    status: "CURRENT_RUN_NOT_EXECUTED",
    commitSha,
    runId,
    branch,
    group: options.group ?? null,
    generatedAt: new Date().toISOString(),
  };

  const fileName = `release-gate-${options.group ?? "unknown"}-not-executed.json`;
  const targetPath = path.join(evidenceDir, fileName);
  fs.writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return targetPath;
}

export function stageReleaseGateEvidence(root, options = {}) {
  const env = options.env ?? process.env;
  const groupLabel = options.group ?? "all";
  const context = resolveCiEvidenceContext(env);
  const evidenceDir = getCiEvidenceDir(root, env);
  fs.mkdirSync(evidenceDir, { recursive: true });

  const report = readReleaseGateReport(root, groupLabel);
  if (!report) {
    const markerPath = writeNotExecutedEvidence(root, { env, group: groupLabel });
    return {
      staged: true,
      executed: false,
      markerPath,
      validation: validateReleaseGateEvidence(
        JSON.parse(fs.readFileSync(markerPath, "utf8")),
        context,
      ),
    };
  }

  const validation = validateReleaseGateEvidence(report, context);
  if (!validation.valid) {
    return { staged: false, executed: true, validation, report };
  }

  const stagedReportPath = path.join(evidenceDir, path.basename(`release-gate-${groupLabel}.json`));
  fs.writeFileSync(stagedReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const logsSource = path.join(root, "var/ops/release-gate-logs");
  const logsTarget = path.join(evidenceDir, "release-gate-logs");
  if (fs.existsSync(logsSource)) {
    fs.cpSync(logsSource, logsTarget, { recursive: true });
  }

  const manifest = {
    commitSha: context.commitSha,
    runId: context.runId,
    branch: context.branch,
    group: groupLabel,
    generatedAt: new Date().toISOString(),
    status: report.status ?? "unknown",
    stagedFiles: [path.relative(root, stagedReportPath)],
  };
  fs.writeFileSync(
    path.join(evidenceDir, "evidence-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return {
    staged: true,
    executed: true,
    validation,
    report,
    evidenceDir,
    stagedReportPath,
  };
}

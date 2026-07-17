import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

export const CANDIDATE_EVIDENCE_SCOPE = "candidate";
export const INVALID_CANDIDATE_EVIDENCE_SCOPE = "invalid-candidate";
export const CANDIDATE_EVIDENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const RUNTIME_PATH_PREFIXES = Object.freeze([
  ".next",
  "playwright-report/",
  "var/ops/",
]);

const RUNTIME_PATHS = new Set([
  "docs/audit/content-audit-2026-07-14.md",
  "src/lib/ops/migration-meta.generated.json",
]);

function normalizeStatusPath(value) {
  const renamedPath = value.includes(" -> ") ? value.split(" -> ").at(-1) : value;
  return renamedPath?.replace(/^"|"$/g, "") ?? "";
}

export function isRuntimeEvidencePath(filePath) {
  return (
    RUNTIME_PATHS.has(filePath) ||
    RUNTIME_PATH_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(prefix))
  );
}

export function parseCandidateDirtyPaths(output) {
  return String(output ?? "")
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      const indexStatus = line[0] ?? " ";
      const worktreeStatus = line[1] ?? " ";
      const filePath = normalizeStatusPath(line.slice(3));
      const untracked = indexStatus === "?" && worktreeStatus === "?";
      const unstaged = worktreeStatus !== " " && worktreeStatus !== "?";
      return (untracked || unstaged) && !isRuntimeEvidencePath(filePath) ? [filePath] : [];
    });
}

export function readGitCandidateTree(root, spawn = spawnSync) {
  const result = spawn("git", ["write-tree"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

export function listCandidateDirtyPaths(root, spawn = spawnSync) {
  const result = spawn("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) return ["git-status-unavailable"];
  return parseCandidateDirtyPaths(result.stdout);
}

export function captureCandidateContext(root, options = {}) {
  const now = options.now ?? (() => new Date());
  return {
    candidateTree: readGitCandidateTree(root, options.spawn),
    evidenceRunId: options.runId ?? randomUUID(),
    evidenceStartedAt: now().toISOString(),
    initialDirtyPaths: listCandidateDirtyPaths(root, options.spawn),
  };
}

export function finalizeCandidateEvidence(root, context, options = {}) {
  const now = options.now ?? (() => new Date());
  const finalTree = readGitCandidateTree(root, options.spawn);
  const finalDirtyPaths = listCandidateDirtyPaths(root, options.spawn);
  const reasons = [];

  if (!context?.candidateTree || !finalTree) reasons.push("missing-candidate-tree");
  if (context?.candidateTree && finalTree && context.candidateTree !== finalTree) {
    reasons.push("candidate-tree-changed");
  }
  if (context?.initialDirtyPaths?.length) reasons.push("dirty-candidate-at-start");
  if (finalDirtyPaths.length) reasons.push("dirty-candidate-at-end");

  const valid = reasons.length === 0;
  return {
    evidenceScope: valid ? CANDIDATE_EVIDENCE_SCOPE : INVALID_CANDIDATE_EVIDENCE_SCOPE,
    candidateTree: valid ? context.candidateTree : null,
    evidenceRunId: context?.evidenceRunId ?? null,
    evidenceStartedAt: context?.evidenceStartedAt ?? null,
    evidenceGeneratedAt: now().toISOString(),
    evidenceEnvironment: options.environment ?? "local-production",
    evidenceBaseUrl: options.baseUrl ?? null,
    evidenceIntegrity: {
      status: valid ? "passed" : "rejected",
      reasons,
      dirtyPaths: [...new Set([...(context?.initialDirtyPaths ?? []), ...finalDirtyPaths])],
    },
  };
}

export function candidateEvidenceMetadata(root, options = {}) {
  const context = captureCandidateContext(root, options);
  return finalizeCandidateEvidence(root, context, options);
}

function reportTimestamp(report) {
  return (
    report?.evidenceGeneratedAt ??
    report?.generatedAt ??
    report?.checkedAt ??
    report?.timestamp ??
    report?.at ??
    null
  );
}

export function validateCandidateEvidence(report, options) {
  const reasons = [];
  const expectedTree = options.candidateTree;

  if (!report || typeof report !== "object") reasons.push("missing-report");
  if (report?.evidenceScope !== CANDIDATE_EVIDENCE_SCOPE) reasons.push("wrong-scope");
  if (report?.evidenceIntegrity?.status !== "passed") reasons.push("failed-integrity");
  if (!expectedTree || report?.candidateTree !== expectedTree) reasons.push("candidate-tree-mismatch");
  if (typeof report?.evidenceRunId !== "string" || report.evidenceRunId.length < 8) {
    reasons.push("missing-run-id");
  }

  const allowedEnvironments = options.allowedEnvironments ?? [];
  if (
    allowedEnvironments.length > 0 &&
    !allowedEnvironments.includes(report?.evidenceEnvironment)
  ) {
    reasons.push("wrong-environment");
  }

  const allowedEvidenceLevels = options.allowedEvidenceLevels ?? [];
  if (
    allowedEvidenceLevels.length > 0 &&
    !allowedEvidenceLevels.includes(report?.evidenceLevel)
  ) {
    reasons.push("wrong-evidence-level");
  }

  if (options.requireBaseUrl && !report?.evidenceBaseUrl) reasons.push("missing-base-url");
  const requiresDeploymentBinding =
    options.requireDeploymentBinding ||
    (options.requireDeploymentBindingForEnvironments ?? []).includes(
      report?.evidenceEnvironment,
    );
  if (requiresDeploymentBinding) {
    if (!report?.deploymentId) reasons.push("missing-deployment-id");
    if (report?.deployedTree !== expectedTree) reasons.push("deployed-tree-mismatch");
  }
  if (options.requireDatabaseBinding) {
    if (!report?.projectRefHash) reasons.push("missing-project-ref");
    if (!report?.migrationId) reasons.push("missing-migration-id");
  }

  if (options.forbidCanonicalProduction && report?.evidenceBaseUrl) {
    const canonicalOrigin = new URL(options.canonicalProductionUrl).origin;
    try {
      if (new URL(report.evidenceBaseUrl).origin === canonicalOrigin) {
        reasons.push("canonical-production-is-baseline");
      }
    } catch {
      reasons.push("invalid-base-url");
    }
  }

  const timestamp = reportTimestamp(report);
  const parsedAt = timestamp ? Date.parse(timestamp) : Number.NaN;
  const nowMs = (options.now ?? new Date()).getTime();
  const maxAgeMs = options.maxAgeMs ?? CANDIDATE_EVIDENCE_MAX_AGE_MS;
  if (!Number.isFinite(parsedAt)) {
    reasons.push("missing-timestamp");
  } else if (parsedAt > nowMs + 5 * 60 * 1000) {
    reasons.push("future-timestamp");
  } else if (nowMs - parsedAt > maxAgeMs) {
    reasons.push("stale-report");
  }

  return { valid: reasons.length === 0, reasons };
}

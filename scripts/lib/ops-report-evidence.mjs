export const OPS_REPORT_MAX_AGE_MS = 26 * 60 * 60 * 1000;

export function resolveHealthyDeploymentGitSha(status, body) {
  const gitSha = typeof body?.gitSha === "string" ? body.gitSha.trim() : "";
  return status === 200 && body?.ok === true && gitSha.length >= 7 ? gitSha : null;
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function reportTimestamp(report) {
  return (
    report?.generatedAt ??
    report?.evidenceGeneratedAt ??
    report?.ranAt ??
    report?.checkedAt ??
    null
  );
}

function shaMatches(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const normalizedActual = actual.trim().toLowerCase();
  const normalizedExpected = expected.trim().toLowerCase();
  if (normalizedActual.length < 7 || normalizedExpected.length < 7) return false;
  return (
    normalizedActual.startsWith(normalizedExpected) ||
    normalizedExpected.startsWith(normalizedActual)
  );
}

export function validateOpsReportEvidence(report, options = {}) {
  const reasons = [];
  if (!report || typeof report !== "object") {
    return { valid: false, reasons: ["missing-report"] };
  }

  if (options.requireGeneratedAt && typeof report.generatedAt !== "string") {
    reasons.push("missing-generated-at");
  }

  const parsedAt = Date.parse(reportTimestamp(report) ?? "");
  const nowMs = (options.now ?? new Date()).getTime();
  const maxAgeMs = options.maxAgeMs ?? OPS_REPORT_MAX_AGE_MS;
  if (!Number.isFinite(parsedAt)) {
    reasons.push("missing-timestamp");
  } else if (parsedAt > nowMs + 5 * 60 * 1000) {
    reasons.push("future-timestamp");
  } else if (nowMs - parsedAt > maxAgeMs) {
    reasons.push("stale-report");
  }

  if (options.requireBaseUrl || options.expectedBaseUrl) {
    const actualOrigin = normalizeOrigin(report.baseUrl ?? report.evidenceBaseUrl);
    const expectedOrigin = normalizeOrigin(options.expectedBaseUrl);
    if (!actualOrigin) reasons.push("missing-base-url");
    if (options.expectedBaseUrl && !expectedOrigin) reasons.push("invalid-expected-base-url");
    if (actualOrigin && expectedOrigin && actualOrigin !== expectedOrigin) {
      reasons.push("base-url-mismatch");
    }
  }

  const actualSha = report.gitSha ?? report.deployedGitSha ?? null;
  if (options.requireExpectedGitSha && !options.expectedGitSha) {
    reasons.push("missing-expected-git-sha");
  }
  if (options.requireGitSha && !actualSha) reasons.push("missing-git-sha");
  if (options.expectedGitSha && !shaMatches(actualSha, options.expectedGitSha)) {
    reasons.push(actualSha ? "git-sha-mismatch" : "missing-git-sha");
  }

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

function vulnerabilityCount(audit) {
  return Number(audit?.metadata?.vulnerabilities?.total ?? Number.NaN);
}

function sorted(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b)));
}

function sameSet(actual, expected) {
  const left = sorted(new Set(actual));
  const right = sorted(new Set(expected));
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function auditSources(vulnerabilities) {
  const sources = new Set();
  for (const vulnerability of Object.values(vulnerabilities)) {
    for (const via of vulnerability?.via ?? []) {
      if (via && typeof via === "object" && Number.isInteger(via.source)) {
        sources.add(via.source);
      }
    }
  }
  return sources;
}

function parseExpiry(expiresOn) {
  if (typeof expiresOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) return null;
  const expiry = new Date(`${expiresOn}T23:59:59.999Z`);
  return Number.isNaN(expiry.getTime()) ? null : expiry;
}

export function evaluateDependencyAuditPolicy({
  fullAudit,
  productionAudit,
  policy,
  packageManifest,
  now = new Date(),
}) {
  const reasons = [];
  if (policy?.schemaVersion !== 1) reasons.push("unsupported policy schema");

  const expiry = parseExpiry(policy?.expiresOn);
  if (!expiry) reasons.push("invalid exception expiry");
  else if (now.getTime() > expiry.getTime()) reasons.push(`exception expired on ${policy.expiresOn}`);

  if (fullAudit?.error) reasons.push("full npm audit returned an error payload");
  if (productionAudit?.error) reasons.push("production npm audit returned an error payload");

  const productionVulnerabilities = productionAudit?.vulnerabilities ?? {};
  const productionTotal = vulnerabilityCount(productionAudit);
  if (!Number.isFinite(productionTotal)) reasons.push("production audit metadata is missing");
  else if (productionTotal !== policy?.requiredProductionVulnerabilityCount) {
    reasons.push(
      `production vulnerability count changed: expected ${policy?.requiredProductionVulnerabilityCount}, got ${productionTotal}`,
    );
  }
  if (Object.keys(productionVulnerabilities).length !== 0) {
    reasons.push(`production audit contains packages: ${sorted(Object.keys(productionVulnerabilities)).join(", ")}`);
  }

  const vulnerabilities = fullAudit?.vulnerabilities ?? {};
  const packages = Object.keys(vulnerabilities);
  const fullTotal = vulnerabilityCount(fullAudit);
  if (!Number.isFinite(fullTotal)) reasons.push("full audit metadata is missing");
  if (packages.length === 0 || fullTotal === 0) {
    reasons.push("bounded exception is stale because the full audit is clean");
  }
  if (!sameSet(packages, policy?.allowedPackages ?? [])) {
    reasons.push(
      `vulnerable package set changed: expected [${sorted(policy?.allowedPackages ?? []).join(", ")}], got [${sorted(packages).join(", ")}]`,
    );
  }
  if (Number.isFinite(fullTotal) && fullTotal !== packages.length) {
    reasons.push(`audit total ${fullTotal} does not match package count ${packages.length}`);
  }

  const allowedSeverities = new Set(policy?.allowedSeverities ?? []);
  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!allowedSeverities.has(vulnerability?.severity)) {
      reasons.push(`${name} has unexpected severity ${vulnerability?.severity ?? "missing"}`);
    }
  }

  const sources = auditSources(vulnerabilities);
  if (!sameSet(sources, policy?.allowedAdvisorySources ?? [])) {
    reasons.push(
      `advisory source set changed: expected [${sorted(policy?.allowedAdvisorySources ?? []).join(", ")}], got [${sorted(sources).join(", ")}]`,
    );
  }

  const dependencies = packageManifest?.dependencies ?? {};
  const devDependencies = packageManifest?.devDependencies ?? {};
  for (const root of policy?.directDevRoots ?? []) {
    if (!Object.hasOwn(devDependencies, root)) reasons.push(`${root} is no longer a direct dev dependency`);
    if (Object.hasOwn(dependencies, root)) reasons.push(`${root} crossed into production dependencies`);
  }

  return {
    status: reasons.length === 0 ? "passed" : "failed",
    reasons,
    exceptionId: policy?.exceptionId ?? null,
    expiresOn: policy?.expiresOn ?? null,
    productionVulnerabilities: Number.isFinite(productionTotal) ? productionTotal : null,
    developmentPackages: sorted(packages),
    advisorySources: sorted(sources),
  };
}

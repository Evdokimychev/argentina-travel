import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDependencyAuditPolicy } from "./dependency-audit-policy.mjs";

const allowedPackages = [
  "@eslint/config-array",
  "@eslint/eslintrc",
  "brace-expansion",
  "eslint",
  "eslint-config-next",
  "eslint-plugin-import",
  "eslint-plugin-jsx-a11y",
  "eslint-plugin-react",
  "minimatch",
];

const policy = {
  schemaVersion: 1,
  exceptionId: "P1-GA-019",
  expiresOn: "2026-08-12",
  allowedAdvisorySources: [1124334],
  allowedSeverities: ["high"],
  allowedPackages,
  directDevRoots: ["@eslint/eslintrc", "eslint", "eslint-config-next"],
  requiredProductionVulnerabilityCount: 0,
};

const packageManifest = {
  dependencies: { next: "^15.5.22" },
  devDependencies: {
    "@eslint/eslintrc": "^3.3.1",
    eslint: "^9.28.0",
    "eslint-config-next": "^15.5.22",
  },
};

function audit(packages = allowedPackages, source = 1124334) {
  return {
    vulnerabilities: Object.fromEntries(
      packages.map((name) => [
        name,
        {
          severity: "high",
          via: name === "brace-expansion" ? [{ source }] : ["brace-expansion"],
        },
      ]),
    ),
    metadata: { vulnerabilities: { total: packages.length } },
  };
}

const cleanProductionAudit = {
  vulnerabilities: {},
  metadata: { vulnerabilities: { total: 0 } },
};

function evaluate(overrides = {}) {
  return evaluateDependencyAuditPolicy({
    fullAudit: audit(),
    productionAudit: cleanProductionAudit,
    policy,
    packageManifest,
    now: new Date("2026-07-29T12:00:00Z"),
    ...overrides,
  });
}

test("accepts only the current bounded dev-only advisory graph", () => {
  assert.equal(evaluate().status, "passed");
});

test("fails when any vulnerability reaches the production graph", () => {
  const outcome = evaluate({
    productionAudit: {
      vulnerabilities: { minimatch: { severity: "high", via: ["brace-expansion"] } },
      metadata: { vulnerabilities: { total: 1 } },
    },
  });
  assert.equal(outcome.status, "failed");
  assert.match(outcome.reasons.join("\n"), /production vulnerability count changed/);
});

test("fails closed on a new package, advisory source or severity", () => {
  const newPackage = evaluate({ fullAudit: audit([...allowedPackages, "unexpected-package"]) });
  assert.equal(newPackage.status, "failed");
  assert.match(newPackage.reasons.join("\n"), /vulnerable package set changed/);

  const newSource = evaluate({ fullAudit: audit(allowedPackages, 9999999) });
  assert.equal(newSource.status, "failed");
  assert.match(newSource.reasons.join("\n"), /advisory source set changed/);

  const changedSeverity = audit();
  changedSeverity.vulnerabilities.minimatch.severity = "critical";
  const severity = evaluate({ fullAudit: changedSeverity });
  assert.equal(severity.status, "failed");
  assert.match(severity.reasons.join("\n"), /unexpected severity critical/);
});

test("fails when upstream remediation makes the exception stale", () => {
  const outcome = evaluate({
    fullAudit: { vulnerabilities: {}, metadata: { vulnerabilities: { total: 0 } } },
  });
  assert.equal(outcome.status, "failed");
  assert.match(outcome.reasons.join("\n"), /exception is stale/);
});

test("fails after expiry or when a direct root crosses into production", () => {
  const expired = evaluate({ now: new Date("2026-08-13T00:00:00Z") });
  assert.equal(expired.status, "failed");
  assert.match(expired.reasons.join("\n"), /exception expired/);

  const crossed = evaluate({
    packageManifest: {
      dependencies: { eslint: "^9.28.0" },
      devDependencies: packageManifest.devDependencies,
    },
  });
  assert.equal(crossed.status, "failed");
  assert.match(crossed.reasons.join("\n"), /crossed into production dependencies/);
});

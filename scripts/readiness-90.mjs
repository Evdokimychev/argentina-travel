#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { evaluateReadiness90 } from "./lib/readiness-90.mjs";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
  validateCandidateEvidence,
} from "./lib/candidate-evidence.mjs";

const root = process.cwd();
const ops = path.join(root, "var/ops");
const context = captureCandidateContext(root);
const evidenceIntegrity = { accepted: [], rejected: [] };

const POLICY = Object.freeze({
  publish: { allowedEnvironments: ["production-candidate"], requireDeploymentBinding: true },
  productionReadiness: { allowedEnvironments: ["production-candidate"], requireDeploymentBinding: true },
  release: { allowedEnvironments: ["local-production", "staging-candidate", "production-candidate"] },
  publicEditorial: { allowedEnvironments: ["local-production", "staging-candidate"], requireBaseUrl: true, forbidCanonicalProduction: true, requireDeploymentBindingForEnvironments: ["staging-candidate"] },
  seo: { allowedEnvironments: ["local-production", "staging-candidate"], requireBaseUrl: true, forbidCanonicalProduction: true, requireDeploymentBindingForEnvironments: ["staging-candidate"] },
  lighthouse: { allowedEnvironments: ["local-production", "staging-candidate"], requireBaseUrl: true, forbidCanonicalProduction: true, requireDeploymentBindingForEnvironments: ["staging-candidate"] },
  ux: { allowedEnvironments: ["staging-candidate", "production-candidate"], requireDeploymentBinding: true },
  analytics: { allowedEnvironments: ["staging-live", "production-live"], requireDeploymentBinding: true },
  rls: { allowedEnvironments: ["staging-live", "production-live"], allowedEvidenceLevels: ["live-database"], requireDatabaseBinding: true },
  staging: { allowedEnvironments: ["staging-live"], requireDeploymentBinding: true, requireDatabaseBinding: true },
  partnerAttribution: { allowedEnvironments: ["partner-sandbox", "partner-live"] },
  commercialFunnel: { allowedEnvironments: ["local-contract"] },
  paymentProvider: { allowedEnvironments: ["local-contract", "provider-sandbox", "provider-live"] },
  operations: { allowedEnvironments: ["local-contract", "staging-live", "production-live"] },
});

function read(name) {
  const file = path.join(ops, name);
  if (!fs.existsSync(file)) return { report: null, file };
  try {
    return { report: JSON.parse(fs.readFileSync(file, "utf8")), file };
  } catch {
    return { report: null, file };
  }
}

function selectCandidate(key, name) {
  const { report, file } = read(name);
  const validation = validateCandidateEvidence(report, {
    candidateTree: context.initialDirtyPaths.length === 0 ? context.candidateTree : null,
    canonicalProductionUrl: "https://www.goargentina.ru",
    ...POLICY[key],
  });
  const item = { key, path: path.relative(root, file), reasons: validation.reasons };
  if (validation.valid) evidenceIntegrity.accepted.push(item);
  else evidenceIntegrity.rejected.push(item);
  return validation.valid ? report : null;
}

function selectEvidence() {
  return {
    publish: selectCandidate("publish", "publish-turnkey-last.json"),
    productionReadiness: selectCandidate("productionReadiness", "production-readiness-last.json"),
    release: selectCandidate("release", "release-gate-report.json"),
    publicEditorial: selectCandidate("publicEditorial", "public-editorial-audit.json"),
    seo: selectCandidate("seo", "seo-audit-last.json"),
    lighthouse: selectCandidate("lighthouse", "lighthouse-phase2-sample-last.json"),
    ux: selectCandidate("ux", "e2e-ux-audit-last.json"),
    analytics: selectCandidate("analytics", "analytics-readiness-last.json"),
    rls: selectCandidate("rls", "rls-audit-last.json"),
    staging: selectCandidate("staging", "staging-acceptance-last.json"),
    partnerAttribution: selectCandidate("partnerAttribution", "partner-attribution-last.json"),
    commercialFunnel: selectCandidate("commercialFunnel", "commercial-funnel-last.json"),
    paymentProvider: selectCandidate("paymentProvider", "payment-provider-readiness-last.json"),
    operations: selectCandidate("operations", "operations-readiness-last.json"),
  };
}

let evidence = selectEvidence();
const aggregateEvidence = finalizeCandidateEvidence(root, context, {
  environment: "local-production",
});
if (aggregateEvidence.evidenceIntegrity.status !== "passed") {
  evidence = Object.fromEntries(Object.keys(evidence).map((key) => [key, null]));
  evidenceIntegrity.rejected.push({
    key: "aggregate",
    path: "scripts/readiness-90.mjs",
    reasons: aggregateEvidence.evidenceIntegrity.reasons,
  });
}

const productionSeoBaseline = read("seo-audit-production-baseline-last.json").report;
const productionLighthouseBaseline = read("lighthouse-phase2-prod-last.json").report;
const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  ...aggregateEvidence,
  evidenceIntegrity,
  comparisons: {
    productionBaseline: {
      seo: productionSeoBaseline,
      lighthouse: productionLighthouseBaseline,
    },
  },
  ...evaluateReadiness90(evidence),
};

console.log("Commercial readiness 90+\n========================\n");
for (const item of report.roles) {
  console.log(`${item.ready ? "✓" : "✗"} ${item.label}: ${item.score}% (target ${item.target}%)`);
  for (const blocker of item.blockers.slice(0, 3)) console.log(`  → ${blocker}`);
}
console.log(`\nOverall: ${report.overall}%`);
console.log(report.ready ? "READY: every role is above target" : "NOT READY: evidence gaps remain");
console.log(`Evidence: ${evidenceIntegrity.accepted.length} accepted, ${evidenceIntegrity.rejected.length} rejected`);

if (process.argv.includes("--write")) {
  fs.mkdirSync(ops, { recursive: true });
  const output = path.join(ops, "commercial-readiness-90-last.json");
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report: ${path.relative(root, output)}`);
}

if (process.argv.includes("--strict") && !report.ready) process.exitCode = 1;

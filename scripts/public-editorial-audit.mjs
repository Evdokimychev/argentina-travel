import fs from "node:fs";
import path from "node:path";
import { auditPublicEditorial } from "./lib/public-editorial-audit.mjs";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "./lib/candidate-evidence.mjs";

const root = process.cwd();
const baseUrl = process.env.EDITORIAL_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const isCanonicalProduction = new URL(baseUrl).origin === "https://www.goargentina.ru";
const evidenceScope = isCanonicalProduction
  ? "production-baseline"
  : process.env.EDITORIAL_EVIDENCE_SCOPE ?? "candidate";
const candidateContext = evidenceScope === "candidate" ? captureCandidateContext(root) : null;
const report = {
  ...(await auditPublicEditorial({ baseUrl })),
  evidenceScope,
  evidenceEnvironment:
    process.env.EVIDENCE_ENVIRONMENT ??
    (evidenceScope === "candidate" ? "local-production" : "production-baseline"),
  evidenceBaseUrl: baseUrl,
  deploymentId: process.env.EVIDENCE_DEPLOYMENT_ID ?? null,
  deployedTree: process.env.EVIDENCE_DEPLOYED_TREE ?? null,
};
if (candidateContext) {
  const evidence = finalizeCandidateEvidence(root, candidateContext, {
    environment: report.evidenceEnvironment,
    baseUrl,
  });
  Object.assign(report, evidence);
  if (evidence.evidenceIntegrity.status !== "passed") report.status = "failed";
}
const output = path.join(root, "var/ops/public-editorial-audit.json");

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `${report.status === "passed" ? "PASS" : "FAIL"}: ${report.uniquePageCount} страниц, ${report.errors.length} ошибок`
);
for (const error of report.errors.slice(0, 50)) {
  console.log(`- ${error.path}: ${error.code} — ${error.detail}`);
}
console.log(`Report: ${path.relative(root, output)}`);

if (process.argv.includes("--strict") && report.status !== "passed") process.exitCode = 1;

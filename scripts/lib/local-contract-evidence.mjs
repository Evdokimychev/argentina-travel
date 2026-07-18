import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
  readGitCandidateTree,
} from "./candidate-evidence.mjs";

export const LOCAL_CONTRACT_SCHEMA_VERSION = 1;
export const EXTERNAL_PROOF_FIELDS = Object.freeze(["live", "sandbox", "external"]);

function commandText(command, args) {
  return [command, ...args].join(" ");
}

function runCommandCheck(root, check, spawn = spawnSync) {
  const startedAt = Date.now();
  const result = spawn(check.command, check.args ?? [], {
    cwd: root,
    env: { ...process.env, CI: process.env.CI ?? "1" },
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  });

  return {
    id: check.id,
    label: check.label,
    kind: "command",
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    command: commandText(check.command, check.args ?? []),
    sources: check.sources ?? [],
  };
}

function runFileCheck(root, check) {
  const startedAt = Date.now();
  const absolutePath = path.join(root, check.file);
  let source = "";
  let readError = null;

  try {
    source = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    readError = error instanceof Error ? error.message : String(error);
  }

  const missingPatterns = readError
    ? check.patterns
    : check.patterns.filter((pattern) => !source.includes(pattern));
  const passed = !readError && missingPatterns.length === 0;

  return {
    id: check.id,
    label: check.label,
    kind: "file-contract",
    status: passed ? "passed" : "failed",
    exitCode: passed ? 0 : 1,
    durationMs: Date.now() - startedAt,
    command: `verify ${check.file}`,
    sources: [check.file],
    ...(passed
      ? {}
      : {
          failure: readError
            ? `cannot read source: ${readError}`
            : `missing contract markers: ${missingPatterns.join(", ")}`,
        }),
  };
}

export function readCandidateTree(root, spawn = spawnSync) {
  return readGitCandidateTree(root, spawn);
}

export function buildLocalContractReport(definition, input) {
  const checks = input.checks;
  const allChecksPassed = checks.length > 0 && checks.every((check) => check.status === "passed");
  const evidence = input.evidence ?? {
    evidenceScope: input.candidateTree ? "candidate" : "invalid-candidate",
    candidateTree: input.candidateTree,
    evidenceRunId: input.evidenceRunId ?? "legacy-test-run",
    evidenceGeneratedAt: input.generatedAt,
    evidenceEnvironment: "local-contract",
    evidenceIntegrity: {
      status: input.candidateTree ? "passed" : "rejected",
      reasons: input.candidateTree ? [] : ["missing-candidate-tree"],
      dirtyPaths: [],
    },
  };
  const status = evidence.evidenceIntegrity?.status === "passed" && allChecksPassed ? "passed" : "failed";
  const passedCheckIds = new Set(
    checks.filter((check) => check.status === "passed").map((check) => check.id),
  );
  const localContracts = {};

  for (const [claim, requiredChecks] of Object.entries(definition.localClaims)) {
    localContracts[claim] =
      status === "passed" &&
      requiredChecks.length > 0 &&
      requiredChecks.every((checkId) => passedCheckIds.has(checkId));
  }

  const report = {
    schemaVersion: LOCAL_CONTRACT_SCHEMA_VERSION,
    reportType: definition.reportType,
    generatedAt: evidence.evidenceGeneratedAt,
    ...evidence,
    evidenceLevel: "local-contract",
    environment: "local-contract",
    status,
    live: false,
    sandbox: false,
    external: false,
    ...Object.fromEntries(definition.externalClaims.map((field) => [field, false])),
    summary: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: checks.filter((check) => check.status === "failed").length,
      total: checks.length,
    },
    localContracts,
    checks,
    limitations: definition.limitations,
  };

  for (const field of EXTERNAL_PROOF_FIELDS) report[field] = false;
  for (const field of definition.externalClaims) report[field] = false;
  return report;
}

export function produceLocalContractEvidence(definition, options = {}) {
  const root = options.root ?? process.cwd();
  const spawn = options.spawn ?? spawnSync;
  const context = captureCandidateContext(root, { spawn, now: options.now });
  const checks = definition.checks.map((check) =>
    check.kind === "file-contract"
      ? runFileCheck(root, check)
      : runCommandCheck(root, check, spawn),
  );
  const evidence = finalizeCandidateEvidence(root, context, {
    spawn,
    now: options.now,
    environment: "local-contract",
  });
  const report = buildLocalContractReport(definition, {
    evidence,
    checks,
  });
  const outputPath = path.join(root, definition.output);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { report, outputPath };
}

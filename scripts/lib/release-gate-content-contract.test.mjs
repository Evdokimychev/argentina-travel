import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const releaseGateSource = fs.readFileSync(
  path.join(process.cwd(), "scripts/release-gate.mjs"),
  "utf8",
);
const ciWorkflowSource = fs.readFileSync(
  path.join(process.cwd(), ".github/workflows/ci.yml"),
  "utf8",
);

test("content release gate blocks on strict knowledge provenance before publication audits", () => {
  const provenanceCheck = releaseGateSource.indexOf('"knowledge-provenance"');
  const strictCommand = releaseGateSource.indexOf('"--strict-provenance"');
  const blogReadiness = releaseGateSource.indexOf('"blog-editorial-readiness"');
  const guideReadiness = releaseGateSource.indexOf('"guide-editorial-readiness"');
  const contentAudit = releaseGateSource.indexOf('"content-lint"');

  assert.ok(provenanceCheck >= 0, "strict knowledge provenance check is missing");
  assert.ok(strictCommand > provenanceCheck, "strict provenance mode is not enabled");
  assert.ok(blogReadiness > strictCommand, "blog readiness must run after knowledge provenance");
  assert.ok(guideReadiness > blogReadiness, "guide readiness must run after blog readiness");
  assert.ok(contentAudit > guideReadiness, "editorial gates must run before derived content reports");
  assert.match(
    releaseGateSource.slice(provenanceCheck, contentAudit),
    /"--strict-provenance"\][\s\S]*?true/,
    "knowledge provenance must be a blocking check",
  );
  assert.match(
    releaseGateSource.slice(blogReadiness, contentAudit),
    /blog:editorial-readiness:check[\s\S]*?true/,
    "blog editorial readiness must be a blocking check",
  );
  assert.match(
    releaseGateSource.slice(guideReadiness, contentAudit),
    /guide:editorial-readiness:check[\s\S]*?true/,
    "guide editorial readiness must be a blocking check",
  );
});

test("CI installs the pinned knowledge validator before the content release gate", () => {
  const verifyRelease = ciWorkflowSource.indexOf("verify-release:");
  const setupPython = ciWorkflowSource.indexOf("actions/setup-python@v5", verifyRelease);
  const installRequirements = ciWorkflowSource.indexOf("requirements-content.txt", setupPython);
  const contentReleaseGate = ciWorkflowSource.indexOf(
    "npm run release:gate -- --group content",
    installRequirements,
  );

  assert.ok(verifyRelease >= 0, "verify-release job is missing");
  assert.ok(setupPython > verifyRelease, "CI Python setup is missing from verify-release");
  assert.ok(installRequirements > setupPython, "pinned Python requirements are not installed");
  assert.ok(
    contentReleaseGate > installRequirements,
    "requirements must be installed before the content release gate",
  );
});

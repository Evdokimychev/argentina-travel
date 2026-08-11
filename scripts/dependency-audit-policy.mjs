#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { evaluateDependencyAuditPolicy } from "./lib/dependency-audit-policy.mjs";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function runAudit(args) {
  const result = spawnSync(npmCommand, ["audit", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`npm audit ${args.join(" ")} exited with ${result.status ?? "unknown"}`);
  }
  if (!result.stdout?.trim()) {
    throw new Error(`npm audit ${args.join(" ")} returned no JSON`);
  }
  return JSON.parse(result.stdout);
}

try {
  const policy = readJson("config/dependency-audit-policy.json");
  const packageManifest = readJson("package.json");
  const fullAudit = runAudit([]);
  const productionAudit = runAudit(["--omit=dev"]);
  const outcome = evaluateDependencyAuditPolicy({
    fullAudit,
    productionAudit,
    policy,
    packageManifest,
  });

  if (outcome.status !== "passed") {
    console.error("Dependency audit policy failed:");
    for (const reason of outcome.reasons) console.error(`- ${reason}`);
    process.exit(1);
  }

  if (outcome.exceptionId) {
    console.log(
      `Dependency audit policy passed: production=0; ${outcome.exceptionId} bounds ${outcome.developmentPackages.length} dev-only packages to advisory ${outcome.advisorySources.join(", ")} until ${outcome.expiresOn}.`,
    );
  } else {
    console.log("Dependency audit policy passed: production=0; development=0; no exception active.");
  }
} catch (error) {
  console.error(
    `Dependency audit policy failed: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exit(1);
}

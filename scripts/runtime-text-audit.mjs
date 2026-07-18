#!/usr/bin/env node
import process from "node:process";
import { auditRuntimeText } from "./lib/runtime-text-audit.mjs";

const findings = auditRuntimeText(process.cwd());

if (findings.length > 0) {
  console.error("Release-visible development or infrastructure text found:");
  for (const finding of findings.slice(0, 100)) {
    console.error(`${finding.file}:${finding.line} [${finding.id}] ${finding.sample}`);
  }
  process.exit(1);
}

console.log("Runtime text audit passed: no release-visible development traces found");

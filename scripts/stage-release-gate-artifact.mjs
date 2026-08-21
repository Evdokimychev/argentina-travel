#!/usr/bin/env node
import process from "node:process";
import {
  stageReleaseGateEvidence,
  validateReleaseGateEvidence,
} from "./lib/release-gate-artifact.mjs";

const groupArgIndex = process.argv.indexOf("--group");
const group = groupArgIndex >= 0 ? process.argv[groupArgIndex + 1] : "all";

const result = stageReleaseGateEvidence(process.cwd(), { group, env: process.env });

if (!result.executed) {
  console.log(`Release gate did not execute for ${group}; staged NOT_EXECUTED marker.`);
  process.exit(0);
}

if (!result.validation?.valid) {
  console.error(`Release gate evidence rejected for ${group}:`, result.validation?.reasons ?? []);
  process.exit(1);
}

console.log(`Release gate evidence staged for ${group}.`);
process.exit(0);

#!/usr/bin/env node
import { cleanStaleReleaseGateArtifacts } from "./lib/release-gate-artifact.mjs";

cleanStaleReleaseGateArtifacts(process.cwd());
console.log("Prepared clean release-gate evidence workspace.");

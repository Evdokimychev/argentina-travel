#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceLocalContractEvidence } from "./lib/local-contract-evidence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const commercialFunnelDefinition = {
  reportType: "commercial-funnel-readiness",
  output: "var/ops/commercial-funnel-last.json",
  checks: [
    {
      id: "event-taxonomy",
      label: "Consent-aware commercial event contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/analytics/gtm-events.test.ts",
        "src/lib/analytics/product-events.test.ts",
      ],
      sources: [
        "src/lib/analytics/gtm-events.test.ts",
        "src/lib/analytics/product-events.test.ts",
      ],
    },
    {
      id: "attribution-contracts",
      label: "First-touch and affiliate attribution contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/attribution/first-touch.test.ts",
        "src/lib/attribution/affiliate-click-server.test.ts",
        "src/app/api/travelpayouts/links/route.test.ts",
      ],
      sources: [
        "src/lib/attribution/first-touch.test.ts",
        "src/lib/attribution/affiliate-click-server.test.ts",
        "src/app/api/travelpayouts/links/route.test.ts",
      ],
    },
    {
      id: "lead-contracts",
      label: "Lead capture, validation and deduplication contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/lead-capture.test.ts",
        "src/lib/lead-capture-validation.test.ts",
        "src/app/api/lead-capture-routes.test.ts",
        "src/lib/admin/lead-crm.test.ts",
      ],
      sources: [
        "src/lib/lead-capture.test.ts",
        "src/lib/lead-capture-validation.test.ts",
        "src/app/api/lead-capture-routes.test.ts",
        "src/lib/admin/lead-crm.test.ts",
      ],
    },
  ],
  localClaims: {
    eventTaxonomy: ["event-taxonomy"],
    consentAwareProductEvents: ["event-taxonomy"],
    attributionContracts: ["attribution-contracts"],
    leadCaptureAdapter: ["lead-contracts"],
    newsletterDeduplication: ["lead-contracts"],
  },
  externalClaims: [
    "events",
    "dashboard",
    "conversionProof",
    "leadCapture",
    "deduplication",
    "revenueAttribution",
  ],
  limitations: [
    "No deployed analytics container or dashboard was inspected.",
    "No real lead delivery or commercial conversion was performed.",
    "No partner dashboard or revenue attribution was verified.",
  ],
};

export function runCommercialFunnelReadiness(options = {}) {
  return produceLocalContractEvidence(commercialFunnelDefinition, { root, ...options });
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const { report, outputPath } = runCommercialFunnelReadiness();
  console.log(`Commercial funnel local contracts: ${report.status}`);
  console.log(`Evidence level: ${report.evidenceLevel}`);
  console.log(`Report: ${path.relative(root, outputPath)}`);
  if (report.status !== "passed") process.exitCode = 1;
}

#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceLocalContractEvidence } from "./lib/local-contract-evidence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const operationsDefinition = {
  reportType: "operations-readiness",
  output: "var/ops/operations-readiness-last.json",
  checks: [
    {
      id: "outbox-retry-contracts",
      label: "Transactional email outbox and retry contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/notifications/email-outbox-security.test.ts",
        "src/lib/leads-notify.test.ts",
      ],
      sources: [
        "src/lib/notifications/email-outbox-security.test.ts",
        "src/lib/leads-notify.test.ts",
      ],
    },
    {
      id: "health-cron-contracts",
      label: "Fail-closed health and cron authorization contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/monitoring/health-status.test.ts",
        "src/lib/cron/authorize-cron.test.ts",
        "src/app/api/bookings/notify/route.test.ts",
        "src/lib/bookings-notify.test.ts",
      ],
      sources: [
        "src/lib/monitoring/health-status.test.ts",
        "src/lib/cron/authorize-cron.test.ts",
        "src/app/api/bookings/notify/route.test.ts",
        "src/lib/bookings-notify.test.ts",
      ],
    },
    {
      id: "incident-runbook-contract",
      label: "Incident rollback runbook markers",
      kind: "file-contract",
      file: "docs/production-cutover-e81.md",
      patterns: ["## 5) План отката (rollback)", "Зафиксировать инцидент"],
    },
    {
      id: "booking-lifecycle-contracts",
      label: "Booking lifecycle and ownership contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/booking-create-command-integrity.test.ts",
        "src/lib/booking-cancellation-integrity.test.ts",
        "src/lib/booking-state-machine.test.ts",
        "src/lib/booking-ownership.test.ts",
        "src/lib/booking-organizer-edit-access.test.ts",
        "src/lib/payments/reconciliation-server.test.ts",
      ],
      sources: [
        "src/lib/booking-create-command-integrity.test.ts",
        "src/lib/booking-cancellation-integrity.test.ts",
        "src/lib/booking-state-machine.test.ts",
        "src/lib/booking-ownership.test.ts",
        "src/lib/booking-organizer-edit-access.test.ts",
        "src/lib/payments/reconciliation-server.test.ts",
      ],
    },
  ],
  localClaims: {
    outboxBeforeSend: ["outbox-retry-contracts"],
    retryMechanics: ["outbox-retry-contracts", "health-cron-contracts"],
    failClosedHealthAndCron: ["health-cron-contracts"],
    incidentRollbackMarkers: ["incident-runbook-contract"],
    bookingLifecycleAndOwnership: ["booking-lifecycle-contracts"],
  },
  externalClaims: ["emailOutbox", "retryProof", "alerting", "bookingSlo", "incidentRunbook"],
  limitations: [
    "No live email delivery, retry execution or dead-letter alert was observed.",
    "No deployed booking SLO or alert destination was inspected.",
    "The runbook check proves repository documentation only, not an exercised incident response.",
  ],
};

export function runOperationsReadiness(options = {}) {
  return produceLocalContractEvidence(operationsDefinition, { root, ...options });
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const { report, outputPath } = runOperationsReadiness();
  console.log(`Operations local contracts: ${report.status}`);
  console.log(`Evidence level: ${report.evidenceLevel}`);
  console.log(`Report: ${path.relative(root, outputPath)}`);
  if (report.status !== "passed") process.exitCode = 1;
}

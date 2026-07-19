#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceLocalContractEvidence } from "./lib/local-contract-evidence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const paymentProviderDefinition = {
  reportType: "payment-provider-readiness",
  output: "var/ops/payment-provider-readiness-last.json",
  checks: [
    {
      id: "payment-core-contracts",
      label: "Provider-neutral money and idempotency contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/payments/provider-contract.test.ts",
        "src/lib/payments/money.test.ts",
        "src/lib/payments/payment-idempotency.test.ts",
        "src/lib/payments/payment-integrity.test.ts",
        "src/lib/payments/payment-sandbox.test.ts",
        "src/lib/payments/sandbox-mode.test.ts",
      ],
      sources: [
        "src/lib/payments/provider-contract.test.ts",
        "src/lib/payments/money.test.ts",
        "src/lib/payments/payment-idempotency.test.ts",
        "src/lib/payments/payment-integrity.test.ts",
        "src/lib/payments/payment-sandbox.test.ts",
        "src/lib/payments/sandbox-mode.test.ts",
      ],
    },
    {
      id: "webhook-contracts",
      label: "Webhook signature, replay and amount integrity contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/payments/webhook-handler.test.ts",
      ],
      sources: ["src/lib/payments/webhook-handler.test.ts"],
    },
    {
      id: "refund-reconciliation-contracts",
      label: "Refund planning and reconciliation contracts",
      kind: "command",
      command: "npx",
      args: [
        "--no-install",
        "vitest",
        "run",
        "src/lib/payments/refund-client-idempotency.test.ts",
        "src/lib/payments/refund-planning-server.test.ts",
        "src/lib/payments/reconciliation-server.test.ts",
        "src/lib/payments/ledger-aggregation.test.ts",
      ],
      sources: [
        "src/lib/payments/refund-client-idempotency.test.ts",
        "src/lib/payments/refund-planning-server.test.ts",
        "src/lib/payments/reconciliation-server.test.ts",
        "src/lib/payments/ledger-aggregation.test.ts",
      ],
    },
  ],
  localClaims: {
    providerNeutralContract: ["payment-core-contracts"],
    idempotency: ["payment-core-contracts", "webhook-contracts"],
    webhookVerificationLogic: ["webhook-contracts"],
    sandboxStateMappingOnly: ["payment-core-contracts"],
    refundPlanning: ["refund-reconciliation-contracts"],
    reconciliationLogic: ["refund-reconciliation-contracts"],
  },
  externalClaims: [
    "ownerApproval",
    "sandboxPayment",
    "signedWebhook",
    "reconciliation",
    "refundProof",
    "disputeProcess",
    "idempotency",
    "legalReview",
    "receiptPolicy",
    "merchantContract",
  ],
  limitations: [
    "No payment provider has owner approval in this report.",
    "No sandbox or live charge, signed provider callback, refund or reconciliation was executed.",
    "No legal, receipt, tax, dispute or merchant-contract review is represented.",
  ],
};

export function runPaymentProviderReadiness(options = {}) {
  return produceLocalContractEvidence(paymentProviderDefinition, { root, ...options });
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const { report, outputPath } = runPaymentProviderReadiness();
  console.log(`Payment provider local contracts: ${report.status}`);
  console.log(`Evidence level: ${report.evidenceLevel}`);
  console.log(`Report: ${path.relative(root, outputPath)}`);
  if (report.status !== "passed") process.exitCode = 1;
}

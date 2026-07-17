import { createHash } from "node:crypto";
import { isMoneyCurrency, type Money } from "./money";

export type PaymentIdempotencyOperation =
  | "checkout"
  | "capture"
  | "refund"
  | "webhook"
  | "reconciliation";

interface PaymentIdempotencyBase {
  readonly providerId: string;
  readonly resourceId: string;
  readonly operationId: string;
}

export type PaymentIdempotencyInput =
  | (PaymentIdempotencyBase & {
      readonly operation: "checkout" | "capture" | "refund";
      readonly amount: Money;
    })
  | (PaymentIdempotencyBase & {
      readonly operation: "webhook" | "reconciliation";
      readonly amount?: never;
    });

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${field} must not be empty.`);
  if (/[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new TypeError(`${field} must not contain control characters.`);
  }
  return normalized;
}

export function createStablePaymentIdempotencyKey(
  input: PaymentIdempotencyInput,
): string {
  const runtimeInput: {
    readonly operation: PaymentIdempotencyOperation;
    readonly amount?: Money;
  } = input;
  const providerId = requiredValue(input.providerId, "providerId").toLowerCase();
  const resourceId = requiredValue(input.resourceId, "resourceId");
  const operationId = requiredValue(input.operationId, "operationId");
  const operation = runtimeInput.operation;
  const amount = runtimeInput.amount;
  const movesMoney =
    operation === "checkout" || operation === "capture" || operation === "refund";
  if (movesMoney && !amount) {
    throw new TypeError(`${operation} idempotency requires an amount.`);
  }
  if (!movesMoney && amount) {
    throw new TypeError(`${operation} idempotency must not include an amount.`);
  }
  if (
    amount &&
    (!Number.isSafeInteger(amount.minorUnits) || amount.minorUnits < 0)
  ) {
    throw new RangeError("amount.minorUnits must be a non-negative safe integer.");
  }
  if (amount && !isMoneyCurrency(amount.currency)) {
    throw new TypeError(`Unsupported amount currency: ${String(amount.currency)}`);
  }
  const canonicalAmount = amount ? `${amount.currency}:${amount.minorUnits}` : "none";
  const digest = createHash("sha256")
    .update(
      JSON.stringify([
        "goargentina-payment-idempotency-v1",
        providerId,
        operation,
        resourceId,
        operationId,
        canonicalAmount,
      ]),
    )
    .digest("hex")
    .slice(0, 32);

  return `goarg-pay-v1-${operation}-${digest}`;
}

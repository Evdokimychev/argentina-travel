export const MONEY_MINOR_UNIT_EXPONENT = {
  RUB: 2,
  ARS: 2,
  USD: 2,
  EUR: 2,
} as const;

export type MoneyCurrency = keyof typeof MONEY_MINOR_UNIT_EXPONENT;

export interface Money {
  readonly currency: MoneyCurrency;
  readonly minorUnits: number;
}

export type MoneyComparison = -1 | 0 | 1;

export type RefundCalculationFailureReason =
  | "currency_mismatch"
  | "unsupported_currency"
  | "negative_amount"
  | "invalid_refund_state"
  | "non_positive_request"
  | "nothing_refundable";

export type RefundRemainingResult =
  | {
      readonly ok: true;
      readonly remaining: Money;
    }
  | {
      readonly ok: false;
      readonly reason: RefundCalculationFailureReason;
    };

export type RefundCapResult =
  | {
      readonly ok: true;
      readonly remainingBeforeRefund: Money;
      readonly approvedRefund: Money;
      readonly remainingAfterRefund: Money;
      readonly wasCapped: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: RefundCalculationFailureReason;
    };

export class MoneyCurrencyMismatchError extends Error {
  constructor(left: MoneyCurrency, right: MoneyCurrency) {
    super(`Money currency mismatch: ${left} !== ${right}`);
    this.name = "MoneyCurrencyMismatchError";
  }
}

export function isMoneyCurrency(value: unknown): value is MoneyCurrency {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(MONEY_MINOR_UNIT_EXPONENT, value)
  );
}

function assertMinorUnits(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Money minorUnits must be a non-negative safe integer.");
  }
}

function assertMoney(value: Money): void {
  if (!isMoneyCurrency(value.currency)) {
    throw new TypeError(`Unsupported money currency: ${String(value.currency)}`);
  }
  assertMinorUnits(value.minorUnits);
}

function assertSameCurrency(left: Money, right: Money): void {
  assertMoney(left);
  assertMoney(right);
  if (left.currency !== right.currency) {
    throw new MoneyCurrencyMismatchError(left.currency, right.currency);
  }
}

function checkedMinorUnits(value: number): number {
  assertMinorUnits(value);
  return value;
}

export function money(currency: MoneyCurrency, minorUnits: number): Money {
  if (!isMoneyCurrency(currency)) {
    throw new TypeError(`Unsupported money currency: ${String(currency)}`);
  }
  assertMinorUnits(minorUnits);
  return Object.freeze({ currency, minorUnits });
}

export function parseMoneyCurrency(value: string): MoneyCurrency | null {
  const normalized = value.trim().toUpperCase();
  return isMoneyCurrency(normalized) ? normalized : null;
}

export function moneyFromMajorUnits(currency: MoneyCurrency, majorUnits: number): Money {
  if (!Number.isFinite(majorUnits) || majorUnits < 0) {
    throw new RangeError("Money majorUnits must be a non-negative finite number.");
  }
  const exponent = MONEY_MINOR_UNIT_EXPONENT[currency];
  const factor = 10 ** exponent;
  const scaled = majorUnits * factor;
  const minorUnits = Math.round(scaled);
  if (!Number.isSafeInteger(minorUnits) || Math.abs(scaled - minorUnits) > 1e-6) {
    throw new RangeError(`Money amount has more than ${exponent} decimal places.`);
  }
  return money(currency, minorUnits);
}

export function moneyToMajorUnits(value: Money): number {
  assertMoney(value);
  return value.minorUnits / 10 ** MONEY_MINOR_UNIT_EXPONENT[value.currency];
}

export function zeroMoney(currency: MoneyCurrency): Money {
  return money(currency, 0);
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return money(left.currency, checkedMinorUnits(left.minorUnits + right.minorUnits));
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return money(left.currency, checkedMinorUnits(left.minorUnits - right.minorUnits));
}

export function compareMoney(left: Money, right: Money): MoneyComparison {
  assertSameCurrency(left, right);
  if (left.minorUnits === right.minorUnits) return 0;
  return left.minorUnits < right.minorUnits ? -1 : 1;
}

export function calculateRefundRemaining(
  captured: Money,
  committedRefunds: Money,
): RefundRemainingResult {
  if (!isMoneyCurrency(captured.currency) || !isMoneyCurrency(committedRefunds.currency)) {
    return { ok: false, reason: "unsupported_currency" };
  }
  if (captured.currency !== committedRefunds.currency) {
    return { ok: false, reason: "currency_mismatch" };
  }
  if (
    !Number.isSafeInteger(captured.minorUnits) ||
    !Number.isSafeInteger(committedRefunds.minorUnits) ||
    captured.minorUnits < 0 ||
    committedRefunds.minorUnits < 0
  ) {
    return { ok: false, reason: "negative_amount" };
  }
  if (committedRefunds.minorUnits > captured.minorUnits) {
    return { ok: false, reason: "invalid_refund_state" };
  }

  return {
    ok: true,
    remaining: money(captured.currency, captured.minorUnits - committedRefunds.minorUnits),
  };
}

export function capRefundAmount(input: {
  captured: Money;
  /** Includes completed and currently reserved/pending refund amounts. */
  committedRefunds: Money;
  requested: Money;
}): RefundCapResult {
  const { captured, committedRefunds, requested } = input;
  if (
    !isMoneyCurrency(captured.currency) ||
    !isMoneyCurrency(committedRefunds.currency) ||
    !isMoneyCurrency(requested.currency)
  ) {
    return { ok: false, reason: "unsupported_currency" };
  }
  if (
    captured.currency !== committedRefunds.currency ||
    captured.currency !== requested.currency
  ) {
    return { ok: false, reason: "currency_mismatch" };
  }
  if (!Number.isSafeInteger(requested.minorUnits) || requested.minorUnits < 0) {
    return { ok: false, reason: "negative_amount" };
  }
  if (requested.minorUnits === 0) {
    return { ok: false, reason: "non_positive_request" };
  }

  const remainingResult = calculateRefundRemaining(captured, committedRefunds);
  if (!remainingResult.ok) return remainingResult;
  if (remainingResult.remaining.minorUnits === 0) {
    return { ok: false, reason: "nothing_refundable" };
  }

  const approvedMinorUnits = Math.min(
    requested.minorUnits,
    remainingResult.remaining.minorUnits,
  );
  const approvedRefund = money(captured.currency, approvedMinorUnits);

  return {
    ok: true,
    remainingBeforeRefund: remainingResult.remaining,
    approvedRefund,
    remainingAfterRefund: money(
      captured.currency,
      remainingResult.remaining.minorUnits - approvedMinorUnits,
    ),
    wasCapped: approvedMinorUnits !== requested.minorUnits,
  };
}

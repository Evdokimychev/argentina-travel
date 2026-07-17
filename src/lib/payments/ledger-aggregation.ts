import {
  money,
  moneyFromMajorUnits,
  moneyToMajorUnits,
  parseMoneyCurrency,
  type Money,
  type MoneyCurrency,
} from "./money";

const CURRENCY_ORDER: readonly MoneyCurrency[] = ["RUB", "ARS", "USD", "EUR"];

const TRANSACTION_TYPES = new Set(["charge", "refund", "payout"]);
const TRANSACTION_STATUSES = new Set([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "rejected",
]);
const PAYOUT_STATUSES = new Set([
  "pending",
  "approved",
  "exported",
  "completed",
  "scheduled",
  "paid",
  "failed",
  "cancelled",
]);

export type LedgerAggregationIssueReason =
  | "unsupported_currency"
  | "invalid_amount"
  | "invalid_precision"
  | "invalid_type"
  | "invalid_status"
  | "amount_mismatch";

export type LedgerAggregationIssue = {
  readonly source: "transaction" | "commission" | "payout" | "snapshot";
  readonly index: number;
  readonly reason: LedgerAggregationIssueReason;
  readonly field?: string;
};

export type LedgerAggregationResult<T> = {
  readonly byCurrency: readonly T[];
  readonly issues: readonly LedgerAggregationIssue[];
};

export type ReconciliationLedgerRecord = {
  readonly type: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
};

export type ReconciliationCurrencyTotals = {
  readonly currency: MoneyCurrency;
  readonly chargeCount: number;
  readonly chargeAmount: number;
  readonly refundCount: number;
  readonly refundAmount: number;
  readonly payoutCount: number;
  readonly payoutAmount: number;
  readonly netAmount: number;
  readonly pendingRefundCount: number;
};

export type CommissionLedgerRecord = {
  readonly grossAmount: number;
  readonly commissionAmount: number;
  readonly organizerNetAmount: number;
  readonly currency: string;
  readonly organizerId?: string | null;
};

export type CommissionCurrencyTotals = {
  readonly currency: MoneyCurrency;
  readonly grossTotal: number;
  readonly commissionTotal: number;
  readonly organizerNetTotal: number;
  readonly snapshotCount: number;
  readonly organizerCount: number;
};

export type PayoutLedgerRecord = {
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
};

export type PayoutCurrencyTotals = {
  readonly currency: MoneyCurrency;
  readonly totalPending: number;
  readonly totalApproved: number;
  readonly totalExported: number;
  readonly totalCompleted: number;
  readonly recordCount: number;
};

export type OrganizerSnapshotLedgerRecord = CommissionLedgerRecord & {
  readonly payoutRecordId?: string | null;
};

export type OrganizerBalanceCurrencyTotals = {
  readonly currency: MoneyCurrency;
  readonly earnedNet: number;
  readonly commissionTotal: number;
  readonly grossTotal: number;
  readonly paidOut: number;
  readonly pendingPayout: number;
  readonly availableBalance: number;
  readonly snapshotCount: number;
  readonly unpaidSnapshotCount: number;
  readonly payoutCount: number;
};

type ParsedRecordMoney =
  | { readonly ok: true; readonly value: Money }
  | { readonly ok: false; readonly issue: LedgerAggregationIssue };

function parseRecordMoney(input: {
  source: LedgerAggregationIssue["source"];
  index: number;
  field: string;
  currency: unknown;
  amount: unknown;
}): ParsedRecordMoney {
  const currency =
    typeof input.currency === "string" ? parseMoneyCurrency(input.currency) : null;
  if (!currency) {
    return {
      ok: false,
      issue: {
        source: input.source,
        index: input.index,
        reason: "unsupported_currency",
        field: "currency",
      },
    };
  }
  if (
    typeof input.amount !== "number" ||
    !Number.isFinite(input.amount) ||
    input.amount < 0
  ) {
    return {
      ok: false,
      issue: {
        source: input.source,
        index: input.index,
        reason: "invalid_amount",
        field: input.field,
      },
    };
  }

  try {
    return { ok: true, value: moneyFromMajorUnits(currency, input.amount) };
  } catch (error) {
    return {
      ok: false,
      issue: {
        source: input.source,
        index: input.index,
        reason:
          error instanceof RangeError && /decimal places/.test(error.message)
            ? "invalid_precision"
            : "invalid_amount",
        field: input.field,
      },
    };
  }
}

function sortedBuckets<T extends { readonly currency: MoneyCurrency }>(
  buckets: Map<MoneyCurrency, T>,
): readonly T[] {
  return CURRENCY_ORDER.flatMap((currency) => {
    const bucket = buckets.get(currency);
    return bucket ? [bucket] : [];
  });
}

function signedMinorUnitsToMajor(currency: MoneyCurrency, minorUnits: number): number {
  const sign = minorUnits < 0 ? -1 : 1;
  return sign * moneyToMajorUnits(money(currency, Math.abs(minorUnits)));
}

export function aggregateReconciliationByCurrency(
  records: readonly ReconciliationLedgerRecord[],
): LedgerAggregationResult<ReconciliationCurrencyTotals> {
  type MutableBucket = {
    currency: MoneyCurrency;
    chargeCount: number;
    chargeMinorUnits: number;
    refundCount: number;
    refundMinorUnits: number;
    payoutCount: number;
    payoutMinorUnits: number;
    pendingRefundCount: number;
  };

  const buckets = new Map<MoneyCurrency, MutableBucket>();
  const issues: LedgerAggregationIssue[] = [];

  records.forEach((record, index) => {
    if (!TRANSACTION_TYPES.has(record.type)) {
      issues.push({ source: "transaction", index, reason: "invalid_type", field: "type" });
      return;
    }
    if (!TRANSACTION_STATUSES.has(record.status)) {
      issues.push({ source: "transaction", index, reason: "invalid_status", field: "status" });
      return;
    }

    const parsed = parseRecordMoney({
      source: "transaction",
      index,
      field: "amount",
      currency: record.currency,
      amount: record.amount,
    });
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return;
    }

    const currency = parsed.value.currency;
    const bucket = buckets.get(currency) ?? {
      currency,
      chargeCount: 0,
      chargeMinorUnits: 0,
      refundCount: 0,
      refundMinorUnits: 0,
      payoutCount: 0,
      payoutMinorUnits: 0,
      pendingRefundCount: 0,
    };

    if (record.type === "charge" && record.status === "completed") {
      bucket.chargeCount += 1;
      bucket.chargeMinorUnits += parsed.value.minorUnits;
    } else if (record.type === "refund") {
      if (record.status === "pending") bucket.pendingRefundCount += 1;
      if (record.status === "completed" || record.status === "processing") {
        bucket.refundCount += 1;
        bucket.refundMinorUnits += parsed.value.minorUnits;
      }
    } else if (
      record.type === "payout" &&
      (record.status === "completed" || record.status === "processing")
    ) {
      bucket.payoutCount += 1;
      bucket.payoutMinorUnits += parsed.value.minorUnits;
    }

    buckets.set(currency, bucket);
  });

  return {
    byCurrency: sortedBuckets(buckets).map((bucket) => ({
      currency: bucket.currency,
      chargeCount: bucket.chargeCount,
      chargeAmount: signedMinorUnitsToMajor(bucket.currency, bucket.chargeMinorUnits),
      refundCount: bucket.refundCount,
      refundAmount: signedMinorUnitsToMajor(bucket.currency, bucket.refundMinorUnits),
      payoutCount: bucket.payoutCount,
      payoutAmount: signedMinorUnitsToMajor(bucket.currency, bucket.payoutMinorUnits),
      netAmount: signedMinorUnitsToMajor(
        bucket.currency,
        bucket.chargeMinorUnits - bucket.refundMinorUnits - bucket.payoutMinorUnits,
      ),
      pendingRefundCount: bucket.pendingRefundCount,
    })),
    issues,
  };
}

type ParsedCommissionRecord = {
  readonly currency: MoneyCurrency;
  readonly gross: Money;
  readonly commission: Money;
  readonly organizerNet: Money;
};

function parseCommissionRecord(
  record: CommissionLedgerRecord,
  index: number,
  source: "commission" | "snapshot",
):
  | { readonly ok: true; readonly value: ParsedCommissionRecord }
  | { readonly ok: false; readonly issue: LedgerAggregationIssue } {
  const amounts = [
    ["grossAmount", record.grossAmount],
    ["commissionAmount", record.commissionAmount],
    ["organizerNetAmount", record.organizerNetAmount],
  ] as const;
  const parsedAmounts: Money[] = [];

  for (const [field, amount] of amounts) {
    const parsed = parseRecordMoney({
      source,
      index,
      field,
      currency: record.currency,
      amount,
    });
    if (!parsed.ok) return parsed;
    parsedAmounts.push(parsed.value);
  }

  const [gross, commission, organizerNet] = parsedAmounts as [Money, Money, Money];
  if (gross.minorUnits !== commission.minorUnits + organizerNet.minorUnits) {
    return {
      ok: false,
      issue: { source, index, reason: "amount_mismatch" },
    };
  }

  return {
    ok: true,
    value: { currency: gross.currency, gross, commission, organizerNet },
  };
}

export function aggregateCommissionByCurrency(
  records: readonly CommissionLedgerRecord[],
): LedgerAggregationResult<CommissionCurrencyTotals> {
  type MutableBucket = {
    currency: MoneyCurrency;
    grossMinorUnits: number;
    commissionMinorUnits: number;
    organizerNetMinorUnits: number;
    snapshotCount: number;
    organizers: Set<string>;
  };
  const buckets = new Map<MoneyCurrency, MutableBucket>();
  const issues: LedgerAggregationIssue[] = [];

  records.forEach((record, index) => {
    const parsed = parseCommissionRecord(record, index, "commission");
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return;
    }
    const { currency, gross, commission, organizerNet } = parsed.value;
    const bucket = buckets.get(currency) ?? {
      currency,
      grossMinorUnits: 0,
      commissionMinorUnits: 0,
      organizerNetMinorUnits: 0,
      snapshotCount: 0,
      organizers: new Set<string>(),
    };
    bucket.grossMinorUnits += gross.minorUnits;
    bucket.commissionMinorUnits += commission.minorUnits;
    bucket.organizerNetMinorUnits += organizerNet.minorUnits;
    bucket.snapshotCount += 1;
    if (record.organizerId?.trim()) bucket.organizers.add(record.organizerId.trim());
    buckets.set(currency, bucket);
  });

  return {
    byCurrency: sortedBuckets(buckets).map((bucket) => ({
      currency: bucket.currency,
      grossTotal: signedMinorUnitsToMajor(bucket.currency, bucket.grossMinorUnits),
      commissionTotal: signedMinorUnitsToMajor(
        bucket.currency,
        bucket.commissionMinorUnits,
      ),
      organizerNetTotal: signedMinorUnitsToMajor(
        bucket.currency,
        bucket.organizerNetMinorUnits,
      ),
      snapshotCount: bucket.snapshotCount,
      organizerCount: bucket.organizers.size,
    })),
    issues,
  };
}

export function aggregatePayoutsByCurrency(
  records: readonly PayoutLedgerRecord[],
): LedgerAggregationResult<PayoutCurrencyTotals> {
  type MutableBucket = {
    currency: MoneyCurrency;
    pendingMinorUnits: number;
    approvedMinorUnits: number;
    exportedMinorUnits: number;
    completedMinorUnits: number;
    recordCount: number;
  };
  const buckets = new Map<MoneyCurrency, MutableBucket>();
  const issues: LedgerAggregationIssue[] = [];

  records.forEach((record, index) => {
    if (!PAYOUT_STATUSES.has(record.status)) {
      issues.push({ source: "payout", index, reason: "invalid_status", field: "status" });
      return;
    }
    const parsed = parseRecordMoney({
      source: "payout",
      index,
      field: "amount",
      currency: record.currency,
      amount: record.amount,
    });
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return;
    }
    const currency = parsed.value.currency;
    const bucket = buckets.get(currency) ?? {
      currency,
      pendingMinorUnits: 0,
      approvedMinorUnits: 0,
      exportedMinorUnits: 0,
      completedMinorUnits: 0,
      recordCount: 0,
    };
    bucket.recordCount += 1;
    if (record.status === "pending" || record.status === "scheduled") {
      bucket.pendingMinorUnits += parsed.value.minorUnits;
    } else if (record.status === "approved") {
      bucket.approvedMinorUnits += parsed.value.minorUnits;
    } else if (record.status === "exported") {
      bucket.exportedMinorUnits += parsed.value.minorUnits;
    } else if (record.status === "completed" || record.status === "paid") {
      bucket.completedMinorUnits += parsed.value.minorUnits;
    }
    buckets.set(currency, bucket);
  });

  return {
    byCurrency: sortedBuckets(buckets).map((bucket) => ({
      currency: bucket.currency,
      totalPending: signedMinorUnitsToMajor(bucket.currency, bucket.pendingMinorUnits),
      totalApproved: signedMinorUnitsToMajor(bucket.currency, bucket.approvedMinorUnits),
      totalExported: signedMinorUnitsToMajor(bucket.currency, bucket.exportedMinorUnits),
      totalCompleted: signedMinorUnitsToMajor(bucket.currency, bucket.completedMinorUnits),
      recordCount: bucket.recordCount,
    })),
    issues,
  };
}

export function aggregateOrganizerBalancesByCurrency(input: {
  readonly snapshots: readonly OrganizerSnapshotLedgerRecord[];
  readonly payouts: readonly PayoutLedgerRecord[];
}): LedgerAggregationResult<OrganizerBalanceCurrencyTotals> {
  type MutableBucket = {
    currency: MoneyCurrency;
    earnedNetMinorUnits: number;
    commissionMinorUnits: number;
    grossMinorUnits: number;
    paidOutMinorUnits: number;
    pendingPayoutMinorUnits: number;
    snapshotCount: number;
    unpaidSnapshotCount: number;
    payoutCount: number;
  };
  const buckets = new Map<MoneyCurrency, MutableBucket>();
  const issues: LedgerAggregationIssue[] = [];

  input.snapshots.forEach((record, index) => {
    const parsed = parseCommissionRecord(record, index, "snapshot");
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return;
    }
    const { currency, gross, commission, organizerNet } = parsed.value;
    const bucket = buckets.get(currency) ?? {
      currency,
      earnedNetMinorUnits: 0,
      commissionMinorUnits: 0,
      grossMinorUnits: 0,
      paidOutMinorUnits: 0,
      pendingPayoutMinorUnits: 0,
      snapshotCount: 0,
      unpaidSnapshotCount: 0,
      payoutCount: 0,
    };
    bucket.earnedNetMinorUnits += organizerNet.minorUnits;
    bucket.commissionMinorUnits += commission.minorUnits;
    bucket.grossMinorUnits += gross.minorUnits;
    bucket.snapshotCount += 1;
    if (!record.payoutRecordId) bucket.unpaidSnapshotCount += 1;
    buckets.set(currency, bucket);
  });

  input.payouts.forEach((record, index) => {
    if (!PAYOUT_STATUSES.has(record.status)) {
      issues.push({ source: "payout", index, reason: "invalid_status", field: "status" });
      return;
    }
    const parsed = parseRecordMoney({
      source: "payout",
      index,
      field: "amount",
      currency: record.currency,
      amount: record.amount,
    });
    if (!parsed.ok) {
      issues.push(parsed.issue);
      return;
    }
    const currency = parsed.value.currency;
    const bucket = buckets.get(currency) ?? {
      currency,
      earnedNetMinorUnits: 0,
      commissionMinorUnits: 0,
      grossMinorUnits: 0,
      paidOutMinorUnits: 0,
      pendingPayoutMinorUnits: 0,
      snapshotCount: 0,
      unpaidSnapshotCount: 0,
      payoutCount: 0,
    };
    bucket.payoutCount += 1;
    if (record.status === "completed" || record.status === "paid") {
      bucket.paidOutMinorUnits += parsed.value.minorUnits;
    } else if (
      record.status === "pending" ||
      record.status === "approved" ||
      record.status === "exported" ||
      record.status === "scheduled"
    ) {
      bucket.pendingPayoutMinorUnits += parsed.value.minorUnits;
    }
    buckets.set(currency, bucket);
  });

  return {
    byCurrency: sortedBuckets(buckets).map((bucket) => ({
      currency: bucket.currency,
      earnedNet: signedMinorUnitsToMajor(bucket.currency, bucket.earnedNetMinorUnits),
      commissionTotal: signedMinorUnitsToMajor(
        bucket.currency,
        bucket.commissionMinorUnits,
      ),
      grossTotal: signedMinorUnitsToMajor(bucket.currency, bucket.grossMinorUnits),
      paidOut: signedMinorUnitsToMajor(bucket.currency, bucket.paidOutMinorUnits),
      pendingPayout: signedMinorUnitsToMajor(
        bucket.currency,
        bucket.pendingPayoutMinorUnits,
      ),
      availableBalance: signedMinorUnitsToMajor(
        bucket.currency,
        Math.max(
          0,
          bucket.earnedNetMinorUnits -
            bucket.paidOutMinorUnits -
            bucket.pendingPayoutMinorUnits,
        ),
      ),
      snapshotCount: bucket.snapshotCount,
      unpaidSnapshotCount: bucket.unpaidSnapshotCount,
      payoutCount: bucket.payoutCount,
    })),
    issues,
  };
}

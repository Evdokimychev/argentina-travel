export type CommissionRuleType = "percent" | "fixed";

export type PlatformCommissionRuleRow = {
  id: string;
  name: string;
  ruleType: CommissionRuleType;
  percentValue: number | null;
  fixedAmount: number | null;
  fixedCurrency: string;
  isDefault: boolean;
  active: boolean;
  /** When set, rule applies to bookings with matching utm_source. */
  utmSourceMatch?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingCommissionSnapshotRow = {
  id: string;
  bookingId: string;
  paymentTransactionId: string;
  organizerUserId: string;
  grossAmount: number;
  commissionAmount: number;
  organizerNetAmount: number;
  commissionRuleId: string | null;
  commissionPercent: number | null;
  commissionFixed: number | null;
  currency: string;
  payoutRecordId: string | null;
  createdAt: string;
  tourTitle?: string;
};

export type OrganizerFinanceCurrencySummary = {
  currency: "RUB" | "ARS" | "USD" | "EUR";
  earnedNet: number;
  commissionTotal: number;
  grossTotal: number;
  paidOut: number;
  pendingPayout: number;
  availableBalance: number;
  snapshotCount: number;
  unpaidSnapshotCount: number;
  payoutCount: number;
};

export type OrganizerFinanceSummary = {
  byCurrency: OrganizerFinanceCurrencySummary[];
  invalidRecordCount: number;
};

export type CommissionReportTotals = {
  byCurrency: Array<{
    currency: "RUB" | "ARS" | "USD" | "EUR";
    grossTotal: number;
    commissionTotal: number;
    organizerNetTotal: number;
    snapshotCount: number;
    organizerCount: number;
  }>;
  snapshotCount: number;
  organizerCount: number;
  invalidRecordCount: number;
};

export const COMMISSION_RULE_TYPE_LABELS: Record<CommissionRuleType, string> = {
  percent: "Процент",
  fixed: "Фиксированная сумма",
};

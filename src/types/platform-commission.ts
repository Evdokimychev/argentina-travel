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

export type OrganizerFinanceSummary = {
  earnedNet: number;
  commissionTotal: number;
  grossTotal: number;
  paidOut: number;
  pendingPayout: number;
  availableBalance: number;
  currency: string;
  snapshotCount: number;
  unpaidSnapshotCount: number;
};

export type CommissionReportTotals = {
  grossTotal: number;
  commissionTotal: number;
  organizerNetTotal: number;
  snapshotCount: number;
  organizerCount: number;
};

export const COMMISSION_RULE_TYPE_LABELS: Record<CommissionRuleType, string> = {
  percent: "Процент",
  fixed: "Фиксированная сумма",
};

import { ANALYTICS_INGESTION_SECURITY } from "@/lib/analytics/ingestion-security";

export type AnalyticsFunnelDataStatus =
  | "trusted"
  | "untrusted_direct_insert"
  | "unavailable";

export function resolveAnalyticsFunnelTrust(input: {
  hasObservedTourViews: boolean;
  ingestionTrusted?: boolean;
}): {
  dataStatus: AnalyticsFunnelDataStatus;
  trustedForKpi: boolean;
  reason: string | null;
} {
  const ingestionTrusted =
    input.ingestionTrusted ?? ANALYTICS_INGESTION_SECURITY.trustedForKpi;

  if (!ingestionTrusted) {
    return {
      dataStatus: "untrusted_direct_insert",
      trustedForKpi: false,
      reason: "Прямой Data API INSERT в analytics_events ещё не закрыт.",
    };
  }
  if (!input.hasObservedTourViews) {
    return {
      dataStatus: "unavailable",
      trustedForKpi: false,
      reason: "Достоверные события просмотра тура за период не накоплены.",
    };
  }
  return { dataStatus: "trusted", trustedForKpi: true, reason: null };
}

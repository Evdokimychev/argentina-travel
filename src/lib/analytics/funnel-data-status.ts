import { ANALYTICS_INGESTION_SECURITY } from "@/lib/analytics/ingestion-security";

export type AnalyticsFunnelDataStatus =
  | "trusted"
  | "untrusted_direct_insert"
  | "unavailable";

export function resolveAnalyticsFunnelTrust(input: {
  metricsAvailable: boolean;
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
      reason: "Контролируемый источник событий для этого релиза не подтверждён.",
    };
  }
  if (!input.metricsAvailable) {
    return {
      dataStatus: "unavailable",
      trustedForKpi: false,
      reason: "Часть показателей сейчас недоступна. Значения не заменены нулями.",
    };
  }
  return { dataStatus: "trusted", trustedForKpi: true, reason: null };
}

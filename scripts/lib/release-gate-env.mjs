export const SEO_PRODUCTION_BASELINE_REPORT_PATH =
  "var/ops/seo-audit-production-baseline-last.json";

export function releaseGateCheckEnv(checkId) {
  if (checkId !== "seo-live-baseline") return {};

  return {
    SEO_AUDIT_REPORT_PATH: SEO_PRODUCTION_BASELINE_REPORT_PATH,
  };
}

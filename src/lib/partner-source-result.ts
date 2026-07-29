/**
 * Distinguishes confirmed empty data from operational partner/DB failures.
 * Callers must not treat `unavailable` as «no tours» / 404.
 */
export type PartnerSourceErrorClass =
  | "auth_restricted"
  | "quota"
  | "timeout"
  | "network"
  | "provider_5xx"
  | "db_unavailable"
  | "malformed_payload"
  | "unknown";

export type PartnerSourceLogName =
  | "tripster_listings_supabase"
  | "tripster_listings_live_fallback"
  | "tripster_listings"
  | "tripster_detail_supabase"
  | "tripster_detail"
  | "tripster_slugs_supabase"
  | "tripster_slugs"
  | "tripster_resolve"
  | "tripster_external_orders"
  | "youtravel_listings_supabase"
  | "youtravel_listings"
  | "youtravel_detail_supabase"
  | "youtravel_detail"
  | "youtravel_slugs_supabase"
  | "youtravel_slugs"
  | "youtravel_resolve";

export type PartnerSourceResult<T> =
  | { status: "ok"; data: T }
  | {
      status: "unavailable";
      retryable: true;
      errorClass: PartnerSourceErrorClass;
      message: string;
    };

export type PartnerSourceUnavailable = Extract<
  PartnerSourceResult<unknown>,
  { status: "unavailable" }
>;

export function partnerOk<T>(data: T): PartnerSourceResult<T> {
  return { status: "ok", data };
}

export function partnerUnavailable(
  errorClass: PartnerSourceErrorClass,
  message: string,
): PartnerSourceUnavailable {
  return { status: "unavailable", retryable: true, errorClass, message };
}

export function classifyPartnerError(error: unknown): PartnerSourceErrorClass {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("402") ||
    lower.includes("egress") ||
    lower.includes("quota") ||
    lower.includes("exceed_egress")
  ) {
    return "quota";
  }
  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("jwt") ||
    lower.includes("auth")
  ) {
    return "auth_restricted";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("abort")) {
    return "timeout";
  }
  if (
    lower.includes("econn") ||
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("connection terminated")
  ) {
    return "network";
  }
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
    return "provider_5xx";
  }
  if (lower.includes("postgres") || lower.includes("database") || lower.includes("supabase")) {
    return "db_unavailable";
  }
  return "unknown";
}

export function partnerUnavailableFromError(error: unknown): PartnerSourceUnavailable {
  return partnerUnavailable(
    classifyPartnerError(error),
    error instanceof Error ? error.message : String(error),
  );
}

export function logPartnerSourceUnavailable(
  source: PartnerSourceLogName,
  result: PartnerSourceUnavailable,
): void {
  console.error("[partner_source_unavailable]", {
    source,
    errorClass: result.errorClass,
    retryable: result.retryable,
  });
}

export function partnerSourceUnavailableError(
  source: PartnerSourceLogName,
  result: PartnerSourceUnavailable,
): Error {
  const error = new Error(`${source}_unavailable:${result.errorClass}`);
  error.name = "PartnerSourceUnavailableError";
  return error;
}

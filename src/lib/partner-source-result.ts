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

export type PartnerSourceResult<T> =
  | { status: "ok"; data: T }
  | {
      status: "unavailable";
      retryable: true;
      errorClass: PartnerSourceErrorClass;
      message: string;
    };

export function partnerOk<T>(data: T): PartnerSourceResult<T> {
  return { status: "ok", data };
}

export function partnerUnavailable(
  errorClass: PartnerSourceErrorClass,
  message: string,
): PartnerSourceResult<never> {
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

export function partnerUnavailableFromError(error: unknown): PartnerSourceResult<never> {
  return partnerUnavailable(
    classifyPartnerError(error),
    error instanceof Error ? error.message : String(error),
  );
}

export function logPartnerSourceUnavailable(
  source: string,
  result: Extract<PartnerSourceResult<unknown>, { status: "unavailable" }>,
): void {
  console.error("[partner_source_unavailable]", {
    source,
    errorClass: result.errorClass,
    retryable: result.retryable,
    message: result.message,
  });
}

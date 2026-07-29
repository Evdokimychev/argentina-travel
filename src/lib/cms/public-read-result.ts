import type { PartnerSourceErrorClass } from "@/lib/partner-source-result";

export type CmsPublicReadResult<T> =
  | { status: "available"; data: T }
  | {
      status: "unavailable";
      retryable: true;
      errorClass: PartnerSourceErrorClass;
      partial?: T;
    };

export type CmsPublicResolution<T> =
  | { status: "resolved"; value: T }
  | { status: "missing" }
  | {
      status: "degraded";
      errorClass: PartnerSourceErrorClass;
      fallback: T | null;
    };

export const CMS_PUBLIC_RETRY_AFTER_SECONDS = 60;
const CMS_UNAVAILABLE_LOG_COOLDOWN_MS = 60_000;

function errorRecord(error: unknown): Record<string, unknown> | null {
  return error && typeof error === "object" ? (error as Record<string, unknown>) : null;
}

function errorFingerprint(error: unknown): { code: string; status: number | null; text: string } {
  const record = errorRecord(error);
  const code = typeof record?.code === "string" ? record.code.toUpperCase() : "";
  const rawStatus = record?.status ?? record?.statusCode;
  const status =
    typeof rawStatus === "number"
      ? rawStatus
      : typeof rawStatus === "string" && /^\d+$/.test(rawStatus)
        ? Number(rawStatus)
        : null;
  const parts = [
    error instanceof Error ? error.name : "",
    error instanceof Error ? error.message : "",
    code,
    typeof record?.message === "string" ? record.message : "",
    typeof record?.details === "string" ? record.details : "",
  ];
  return { code, status, text: parts.join(" ").toLowerCase() };
}

/** Classify without retaining or exposing provider messages, hints or credentials. */
export function classifyCmsPublicReadError(error: unknown): PartnerSourceErrorClass {
  const { code, status, text } = errorFingerprint(error);

  if (
    status === 402 ||
    text.includes("exceed_egress") ||
    text.includes("egress quota") ||
    text.includes("quota")
  ) {
    return "quota";
  }
  if (code === "PGRST003" || status === 504 || /timeout|timed out|abort/.test(text)) {
    return "timeout";
  }
  if (
    status === 401 ||
    status === 403 ||
    code === "42501" ||
    code.startsWith("28") ||
    /^PGRST30[1-3]$/.test(code)
  ) {
    return "auth_restricted";
  }
  if (
    /^PGRST00[0-2]$/.test(code) ||
    code.startsWith("08") ||
    code.startsWith("53") ||
    status === 503
  ) {
    return "db_unavailable";
  }
  if (/econn|network|fetch failed|connection terminated/.test(text)) return "network";
  if (status !== null && status >= 500) return "provider_5xx";
  return "unknown";
}

export function cmsPublicAvailable<T>(
  data: T,
): Extract<CmsPublicReadResult<T>, { status: "available" }> {
  return { status: "available", data };
}

export function cmsPublicUnavailable<T>(
  error: unknown,
  partial?: T,
): Extract<CmsPublicReadResult<T>, { status: "unavailable" }> {
  return {
    status: "unavailable",
    retryable: true,
    errorClass: classifyCmsPublicReadError(error),
    ...(partial === undefined ? {} : { partial }),
  };
}

export class CmsPublicContentUnavailableError extends Error {
  readonly retryable = true;

  constructor(readonly errorClass: PartnerSourceErrorClass) {
    super(`cms_public_content_unavailable:${errorClass}`);
    this.name = "CmsPublicContentUnavailableError";
  }
}

export function isCmsPublicContentUnavailableError(
  error: unknown,
): error is CmsPublicContentUnavailableError {
  return error instanceof CmsPublicContentUnavailableError;
}

export function createCmsPublicUnavailableReporter(options?: {
  now?: () => number;
  cooldownMs?: number;
  log?: (event: string, fields: Record<string, unknown>) => void;
}) {
  const now = options?.now ?? Date.now;
  const cooldownMs = options?.cooldownMs ?? CMS_UNAVAILABLE_LOG_COOLDOWN_MS;
  const log = options?.log ?? ((event, fields) => console.error(event, fields));
  const lastReportedAt = new Map<string, number>();

  return (scope: string, errorClass: PartnerSourceErrorClass): boolean => {
    const key = `${scope}:${errorClass}`;
    const current = now();
    const previous = lastReportedAt.get(key);
    if (previous !== undefined && current - previous < cooldownMs) return false;
    lastReportedAt.set(key, current);
    log("[cms_public_unavailable]", {
      scope,
      errorClass,
      retryable: true,
    });
    return true;
  };
}

const reportSharedCmsPublicUnavailable = createCmsPublicUnavailableReporter();

export function reportCmsPublicUnavailable(
  scope: string,
  error: CmsPublicContentUnavailableError,
): void {
  reportSharedCmsPublicUnavailable(scope, error.errorClass);
}

/** Apply a reviewed local fallback outside cache boundaries; unknown failures still throw. */
export async function withCmsPublicFallback<T>(
  scope: string,
  fallback: T,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isCmsPublicContentUnavailableError(error)) throw error;
    reportCmsPublicUnavailable(scope, error);
    return fallback;
  }
}

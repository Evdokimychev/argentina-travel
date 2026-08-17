const SENSITIVE_KEY =
  /(password|secret|token|authorization|cookie|api[_-]?key|passport|document|email|phone|card|cvv|iban)/i;
const SENSITIVE_VALUE =
  /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b(?:\+?\d[\d\s().-]{8,}\d)\b|(?:sk|pk|whsec|Bearer)\s*[A-Za-z0-9._-]{8,}/i;

const REDACTED = "[redacted]";

/**
 * Scrub secrets and obvious PII from monitoring extras / breadcrumbs.
 * Keeps structure; never invents payment or business state.
 */
export function scrubMonitoringData(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY.test(key)) {
      scrubbed[key] = REDACTED;
      continue;
    }
    if (typeof value === "string") {
      scrubbed[key] = SENSITIVE_VALUE.test(value)
        ? REDACTED
        : value.length > 500
          ? `${value.slice(0, 500)}…`
          : value;
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      scrubbed[key] = scrubMonitoringData(value as Record<string, unknown>);
      continue;
    }
    scrubbed[key] = value;
  }
  return scrubbed;
}

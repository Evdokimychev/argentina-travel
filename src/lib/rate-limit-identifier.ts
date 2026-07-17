import { createHash } from "node:crypto";

/**
 * Builds a non-PII key fragment for secondary rate limits.
 * Purpose binding prevents the same identifier hash from being reused across flows.
 */
export function hashRateLimitIdentifier(purpose: string, value: string): string {
  const normalizedPurpose = purpose.trim().toLowerCase();
  const normalizedValue = value.trim().toLowerCase();
  return createHash("sha256")
    .update(`${normalizedPurpose}:${normalizedValue}`, "utf8")
    .digest("hex");
}

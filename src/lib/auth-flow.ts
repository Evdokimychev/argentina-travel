import type { EmailOtpType } from "@supabase/supabase-js";

const INVISIBLE_EMAIL_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

export const RECOVERY_FLOW_COOKIE = "goargentina-recovery";

export const AUTH_CONFIRM_TYPES = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

const AUTH_NEXT_PATHS = new Set([
  "/",
  "/profile",
  "/organizer",
  "/account/update-password",
]);

export function normalizeAuthEmail(value: string): string {
  return value.normalize("NFKC").replace(INVISIBLE_EMAIL_CHARS, "").trim().toLowerCase();
}

export function isValidAuthEmail(value: string): boolean {
  const email = normalizeAuthEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function resolveSafeAuthNext(value: string | null, type?: EmailOtpType | null): string {
  if (type === "recovery") return "/account/update-password";
  if (!value || !AUTH_NEXT_PATHS.has(value)) return "/";
  return value;
}

export function parseRetryAfterSeconds(input: unknown, fallback = 60): number {
  const raw = input instanceof Error ? input.message : String(input ?? "");
  const explicit = raw.match(/(?:after|через)\s+(\d+)\s*(?:seconds?|секунд)/i);
  const value = explicit ? Number(explicit[1]) : fallback;
  return Math.max(1, Math.min(3600, Number.isFinite(value) ? Math.ceil(value) : fallback));
}

export type AuthClientErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limit"
  | "user_banned"
  | "network_error"
  | "configuration_error"
  | "unknown";

export function mapAuthClientError(error: unknown): AuthClientErrorCode {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const message = `${record.code ?? ""} ${record.message ?? String(error ?? "")}`.toLowerCase();
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "invalid_credentials";
  }
  if (message.includes("email not confirmed")) return "email_not_confirmed";
  if (message.includes("rate") || message.includes("too many") || record.status === 429) {
    return "rate_limit";
  }
  if (message.includes("banned")) return "user_banned";
  if (message.includes("fetch") || message.includes("network")) return "network_error";
  if (message.includes("not configured") || message.includes("missing")) {
    return "configuration_error";
  }
  return "unknown";
}

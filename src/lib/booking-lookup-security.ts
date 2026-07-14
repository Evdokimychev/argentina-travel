import "server-only";

import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const BOOKING_LOOKUP_COOKIE = "goargentina_booking_lookup";
export const BOOKING_LOOKUP_OTP_TTL_MS = 10 * 60_000;
export const BOOKING_LOOKUP_SESSION_TTL_MS = 15 * 60_000;
export const BOOKING_LOOKUP_MAX_ATTEMPTS = 5;

function secret(): string {
  const value = process.env.BOOKING_LOOKUP_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) throw new Error("Booking lookup secret is not configured");
  return value;
}

export function normalizeLookupEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function hashLookupValue(purpose: string, value: string): string {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("hex");
}

export function generateLookupCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateLookupSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyLookupHash(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(actual, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

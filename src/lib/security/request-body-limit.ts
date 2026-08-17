import { NextResponse } from "next/server";

/** Default ceiling for high-risk JSON admin/finance mutations (64 KiB). */
export const HIGH_RISK_JSON_BODY_MAX_BYTES = 65_536;

/** Public booking create / partner request ceiling (32 KiB). */
export const BOOKING_JSON_BODY_MAX_BYTES = 32_768;

/**
 * Reject oversized bodies early via Content-Length when present.
 * Does not replace streamed size checks for routes that already use readLimitedJson.
 */
export function rejectOversizedJsonBody(
  request: Request,
  maxBytes: number = HIGH_RISK_JSON_BODY_MAX_BYTES,
  message = "Запрос слишком большой",
): NextResponse | null {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return NextResponse.json({ error: message }, { status: 413 });
  }
  return null;
}

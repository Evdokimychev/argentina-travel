import { NextResponse } from "next/server";
import {
  applyPublicApiCorsHeaders,
  publicApiPreflightResponse,
} from "@/lib/public-api/cors";
import { requirePublicApiScope, resolvePublicApiKey } from "@/lib/public-api/auth";
import { logPublicApiKeyUsage } from "@/lib/public-api/usage-log";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";
import type { PublicApiScope } from "@/types/public-api";

type PublicApiHandler = (
  request: Request,
  context: { key: import("@/lib/public-api/auth").ResolvedPublicApiKey }
) => Promise<Response>;

export async function handlePublicApiRequest(
  request: Request,
  scope: PublicApiScope,
  handler: PublicApiHandler
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return publicApiPreflightResponse(request);
  }

  if (request.method !== "GET") {
    const response = NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    return applyPublicApiCorsHeaders(response, request);
  }

  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(`public-api:ip:${ip}`, 180, 60_000);
  if (!ipLimit.ok) {
    const response = rateLimitErrorResponse(
      ipLimit.retryAfterSec,
      "Слишком много запросов к публичному API. Повторите позже."
    );
    return applyPublicApiCorsHeaders(response, request);
  }

  const endpoint = new URL(request.url).pathname;
  const auth = await resolvePublicApiKey(request);
  if (!auth.ok) {
    return applyPublicApiCorsHeaders(auth.response, request);
  }

  const scopeError = requirePublicApiScope(auth.key, scope);
  if (scopeError) {
    void logPublicApiKeyUsage({
      keyId: auth.key.id,
      endpoint,
      status: scopeError.status,
    });
    return applyPublicApiCorsHeaders(scopeError, request);
  }

  try {
    const response = await handler(request, { key: auth.key });
    void logPublicApiKeyUsage({
      keyId: auth.key.id,
      endpoint,
      status: response.status,
    });
    return applyPublicApiCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
    void logPublicApiKeyUsage({
      keyId: auth.key.id,
      endpoint,
      status: response.status,
    });
    return applyPublicApiCorsHeaders(response, request);
  }
}

export function publicApiJson(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

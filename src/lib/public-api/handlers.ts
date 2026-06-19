import { NextResponse } from "next/server";
import {
  applyPublicApiCorsHeaders,
  publicApiPreflightResponse,
} from "@/lib/public-api/cors";
import { requirePublicApiScope, resolvePublicApiKey } from "@/lib/public-api/auth";
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

  const auth = await resolvePublicApiKey(request);
  if (!auth.ok) {
    return applyPublicApiCorsHeaders(auth.response, request);
  }

  const scopeError = requirePublicApiScope(auth.key, scope);
  if (scopeError) {
    return applyPublicApiCorsHeaders(scopeError, request);
  }

  try {
    const response = await handler(request, { key: auth.key });
    return applyPublicApiCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
    return applyPublicApiCorsHeaders(response, request);
  }
}

export function publicApiJson(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

const DEFAULT_METHODS = "GET, OPTIONS";
const DEFAULT_HEADERS = "Authorization, Content-Type, X-API-Key";

function parseAllowedOrigins(): string[] {
  const raw = process.env.PUBLIC_API_CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function resolvePublicApiCorsOrigin(request: Request): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return null;

  const allowed = parseAllowedOrigins();
  if (allowed.includes("*")) return origin;
  if (allowed.includes(origin)) return origin;
  return null;
}

export function applyPublicApiCorsHeaders(
  response: Response,
  request: Request,
  options?: { methods?: string; headers?: string }
): Response {
  const allowOrigin = resolvePublicApiCorsOrigin(request);
  if (!allowOrigin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", options?.methods ?? DEFAULT_METHODS);
  headers.set("Access-Control-Allow-Headers", options?.headers ?? DEFAULT_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function publicApiPreflightResponse(request: Request): Response {
  const allowOrigin = resolvePublicApiCorsOrigin(request);
  if (!allowOrigin) {
    return new Response(null, { status: 204 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      Vary: "Origin",
      "Access-Control-Allow-Methods": DEFAULT_METHODS,
      "Access-Control-Allow-Headers": DEFAULT_HEADERS,
      "Access-Control-Max-Age": "86400",
    },
  });
}
